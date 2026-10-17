import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { BulkCreateEnrollmentsDto } from './dto/bulk-enrollments.dto.js';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto.js';
import { EnrollmentStatus } from '@prisma/client';
import {
  assignedClassroomIds,
  assertClassroomAssigned,
  resolveTeacherScope,
} from '../../common/helpers/teacher-scope.js';
import {
  assertStudentVisible,
  resolveVisibleStudentIds,
} from '../../common/helpers/family-scope.js';
import type { RequestActor } from '../../common/types/request-actor.js';
import { ListEnrollmentsQuery } from './dto/list-enrollments.query.js';
import {
  containsInsensitive,
  paginate,
  parseListQuery,
} from '../../common/helpers/list-query.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(establishmentId: string, dto: CreateEnrollmentDto) {
    // Vérifie que l'élève existe dans l'établissement
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, establishmentId, isActive: true },
    });
    if (!student) throw new BadRequestException('Élève invalide');

    // Vérifie la classe
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: dto.classroomId, establishmentId, isActive: true },
    });
    if (!classroom) throw new BadRequestException('Classe invalide');

    // Vérifie l'année scolaire
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, establishmentId, isActive: true },
    });
    if (!academicYear) throw new BadRequestException('Année scolaire invalide');

    // Vérifie qu'il n'y a pas déjà une inscription pour cet élève cette année
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        studentId_academicYearId: {
          studentId: dto.studentId,
          academicYearId: dto.academicYearId,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        'Cet élève est déjà inscrit pour cette année scolaire',
      );
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        establishmentId,
        studentId: dto.studentId,
        classroomId: dto.classroomId,
        academicYearId: dto.academicYearId,
        status: dto.status ?? EnrollmentStatus.APPROVED,
        enrolledAt: new Date(),
        notes: dto.notes,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            userId: true,
          },
        },
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });

    // Notifie l'élève et ses parents (comptes liés uniquement).
    const links = await this.prisma.parentStudent.findMany({
      where: { studentId: dto.studentId },
      include: { parent: { select: { userId: true } } },
    });
    await this.notificationsService.notify(establishmentId,
      [enrollment.student.userId, ...links.map((l) => l.parent.userId)],
      {
        type: 'INSCRIPTION',
        title: `Inscription — ${enrollment.student.firstName} ${enrollment.student.lastName}`,
        message: `${enrollment.classroom.name} · ${enrollment.academicYear.name}`,
        link: '/schedules',
      },
    );

    return enrollment;
  }

  /**
   * Inscription en masse d'élèves dans une classe pour une année.
   * Chaque élève est traité indépendamment (erreurs par élève).
   */
  async bulkCreate(establishmentId: string, dto: BulkCreateEnrollmentsDto) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: dto.classroomId, establishmentId, isActive: true },
    });
    if (!classroom) throw new BadRequestException('Classe invalide');

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, establishmentId, isActive: true },
    });
    if (!academicYear) throw new BadRequestException('Année scolaire invalide');

    const uniqueIds = [...new Set(dto.studentIds)];
    const students = await this.prisma.student.findMany({
      where: { id: { in: uniqueIds }, establishmentId, isActive: true },
      select: { id: true, firstName: true, lastName: true, userId: true },
    });
    const studentMap = new Map(students.map((student) => [student.id, student]));

    const existing = await this.prisma.enrollment.findMany({
      where: { studentId: { in: uniqueIds }, academicYearId: dto.academicYearId },
      select: { studentId: true },
    });
    const alreadyEnrolled = new Set(existing.map((row) => row.studentId));

    const errors: Array<{ studentId: string; message: string }> = [];
    const createdStudents: typeof students = [];

    for (const studentId of uniqueIds) {
      const student = studentMap.get(studentId);
      if (!student) {
        errors.push({ studentId, message: 'Élève introuvable' });
        continue;
      }
      if (alreadyEnrolled.has(studentId)) {
        errors.push({
          studentId,
          message: `${student.firstName} ${student.lastName} : déjà inscrit pour cette année`,
        });
        continue;
      }
      try {
        await this.prisma.enrollment.create({
          data: {
            establishmentId,
            studentId,
            classroomId: dto.classroomId,
            academicYearId: dto.academicYearId,
            status: EnrollmentStatus.APPROVED,
            enrolledAt: new Date(),
          },
        });
        alreadyEnrolled.add(studentId);
        createdStudents.push(student);
      } catch {
        errors.push({
          studentId,
          message: `${student.firstName} ${student.lastName} : création impossible`,
        });
      }
    }

    if (createdStudents.length > 0) {
      await this.notifyEnrollments(
        establishmentId,
        createdStudents,
        `${classroom.name} · ${academicYear.name}`,
      );
    }

    return {
      total: uniqueIds.length,
      created: createdStudents.length,
      errors,
    };
  }

  /** Notifie chaque nouvel inscrit (+ parents liés), en lots bornés. */
  private async notifyEnrollments(
    establishmentId: string,
    students: Array<{
      id: string;
      firstName: string;
      lastName: string;
      userId: string | null;
    }>,
    message: string,
  ) {
    const links = await this.prisma.parentStudent.findMany({
      where: { studentId: { in: students.map((student) => student.id) } },
      include: { parent: { select: { userId: true } } },
    });
    const parentsByStudent = new Map<string, string[]>();
    for (const link of links) {
      if (!link.parent.userId) continue;
      const list = parentsByStudent.get(link.studentId) ?? [];
      list.push(link.parent.userId);
      parentsByStudent.set(link.studentId, list);
    }

    const CHUNK = 20;
    for (let index = 0; index < students.length; index += CHUNK) {
      const slice = students.slice(index, index + CHUNK);
      await Promise.all(
        slice.map((student) =>
          this.notificationsService.notify(
            establishmentId,
            [student.userId, ...(parentsByStudent.get(student.id) ?? [])],
            {
              type: 'INSCRIPTION',
              title: `Inscription — ${student.firstName} ${student.lastName}`,
              message,
              link: '/schedules',
            },
          ),
        ),
      );
    }
  }

  /**
   * Liste avec recherche et pagination : `?search=&classroomId=&academicYearId=&status=&page=&limit=`.
   * Périmètres acteur préservés (enseignant / famille). Sans param → tableau brut.
   */
  async findAll(
    establishmentId: string,
    actor?: RequestActor,
    query: ListEnrollmentsQuery = {},
  ) {
    // Périmètre enseignant : inscrits de ses classes (registre d'appel/notes).
    let classroomIds: string[] | undefined;
    const scope = await resolveTeacherScope(this.prisma, establishmentId, actor);
    if (scope) classroomIds = [...assignedClassroomIds(scope)];

    // Périmètre famille : ses inscriptions (lui-même / ses enfants).
    let studentIds: string[] | undefined;
    if (actor?.role === 'STUDENT' || actor?.role === 'PARENT') {
      studentIds = await resolveVisibleStudentIds(
        this.prisma,
        actor,
        establishmentId,
      );
    }

    const include = {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          matricule: true,
        },
      },
      classroom: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true, isCurrent: true } },
    };
    const parsed = parseListQuery({
      page: query.page,
      limit: query.limit,
      search: query.search,
      hasFilter:
        query.classroomId !== undefined ||
        query.academicYearId !== undefined ||
        query.status !== undefined,
    });
    if (!parsed.paginated) {
      return this.prisma.enrollment.findMany({
        where: {
          establishmentId,
          isActive: true,
          ...(classroomIds ? { classroomId: { in: classroomIds } } : {}),
          ...(studentIds ? { studentId: { in: studentIds } } : {}),
        },
        include,
        orderBy: { createdAt: 'desc' },
      });
    }

    const where: Record<string, unknown> = {
      establishmentId,
      isActive: true,
      ...(classroomIds ? { classroomId: { in: classroomIds } } : {}),
      ...(studentIds ? { studentId: { in: studentIds } } : {}),
    };
    if (query.classroomId) where.classroomId = query.classroomId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.status) where.status = query.status;
    if (parsed.search) {
      const match = containsInsensitive(parsed.search);
      where.OR = [
        { student: { firstName: match } },
        { student: { lastName: match } },
        { student: { matricule: match } },
      ];
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.enrollment.count({ where }),
      this.prisma.enrollment.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: parsed.skip,
        take: parsed.limit,
      }),
    ]);
    return paginate(items, total, parsed.page, parsed.limit);
  }

  async findOne(id: string, establishmentId: string, actor?: RequestActor) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id, establishmentId },
      include: {
        student: true,
        classroom: true,
        academicYear: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Inscription introuvable');
    }

    const scope = await resolveTeacherScope(this.prisma, establishmentId, actor);
    if (scope) assertClassroomAssigned(scope, enrollment.classroomId);

    if (actor?.role === 'STUDENT' || actor?.role === 'PARENT') {
      await assertStudentVisible(
        this.prisma,
        actor,
        enrollment.studentId,
        establishmentId,
      );
    }

    return enrollment;
  }

  async update(id: string, establishmentId: string, dto: UpdateEnrollmentDto) {
    await this.findOne(id, establishmentId);

    return this.prisma.enrollment.update({
      where: { id },
      data: dto,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.enrollment.update({
      where: { id },
      data: { isActive: false, status: EnrollmentStatus.WITHDRAWN },
    });
  }
}
