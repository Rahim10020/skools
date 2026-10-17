import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto.js';
import { BulkCreateTeacherAssignmentsDto } from './dto/bulk-teacher-assignments.dto.js';
import {
  listTeacherAssignments,
  resolveTeacherId,
} from '../../common/helpers/teacher-scope.js';
import type { RequestActor } from '../../common/types/request-actor.js';

@Injectable()
export class TeacherAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateTeacherAssignmentDto) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: dto.teacherId, establishmentId, isActive: true },
    });
    if (!teacher) throw new BadRequestException('Enseignant invalide');

    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, establishmentId, isActive: true },
    });
    if (!subject) throw new BadRequestException('Matière invalide');

    const classroom = await this.prisma.classroom.findFirst({
      where: { id: dto.classroomId, establishmentId, isActive: true },
    });
    if (!classroom) throw new BadRequestException('Classe invalide');

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, establishmentId, isActive: true },
    });
    if (!academicYear) throw new BadRequestException('Année scolaire invalide');

    const existing = await this.prisma.teacherAssignment.findUnique({
      where: {
        teacherId_subjectId_classroomId_academicYearId: {
          teacherId: dto.teacherId,
          subjectId: dto.subjectId,
          classroomId: dto.classroomId,
          academicYearId: dto.academicYearId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Cette affectation existe déjà');
    }

    return this.prisma.teacherAssignment.create({
      data: {
        establishmentId,
        teacherId: dto.teacherId,
        subjectId: dto.subjectId,
        classroomId: dto.classroomId,
        academicYearId: dto.academicYearId,
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        subject: { select: { id: true, name: true } },
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Affectation en masse : un enseignant × plusieurs couples (matière, classe)
   * pour une année. Chaque couple est traité indépendamment (erreurs par ligne).
   */
  async bulkCreate(
    establishmentId: string,
    dto: BulkCreateTeacherAssignmentsDto,
  ) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: dto.teacherId, establishmentId, isActive: true },
    });
    if (!teacher) throw new BadRequestException('Enseignant invalide');

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, establishmentId, isActive: true },
    });
    if (!academicYear) throw new BadRequestException('Année scolaire invalide');

    const subjectIds = [...new Set(dto.assignments.map((a) => a.subjectId))];
    const classroomIds = [...new Set(dto.assignments.map((a) => a.classroomId))];
    const [subjects, classrooms, existing] = await Promise.all([
      this.prisma.subject.findMany({
        where: { id: { in: subjectIds }, establishmentId, isActive: true },
        select: { id: true },
      }),
      this.prisma.classroom.findMany({
        where: { id: { in: classroomIds }, establishmentId, isActive: true },
        select: { id: true },
      }),
      this.prisma.teacherAssignment.findMany({
        where: {
          establishmentId,
          teacherId: dto.teacherId,
          academicYearId: dto.academicYearId,
        },
        select: { subjectId: true, classroomId: true },
      }),
    ]);
    const subjectSet = new Set(subjects.map((s) => s.id));
    const classroomSet = new Set(classrooms.map((c) => c.id));
    const existingSet = new Set(
      existing.map((e) => `${e.subjectId}:${e.classroomId}`),
    );

    const errors: Array<{ line: number; message: string }> = [];
    let created = 0;

    for (let index = 0; index < dto.assignments.length; index++) {
      const line = index + 1;
      const item = dto.assignments[index];
      if (!subjectSet.has(item.subjectId)) {
        errors.push({ line, message: 'Matière invalide' });
        continue;
      }
      if (!classroomSet.has(item.classroomId)) {
        errors.push({ line, message: 'Classe invalide' });
        continue;
      }
      const key = `${item.subjectId}:${item.classroomId}`;
      if (existingSet.has(key)) {
        errors.push({ line, message: 'Affectation déjà existante' });
        continue;
      }
      try {
        await this.prisma.teacherAssignment.create({
          data: {
            establishmentId,
            teacherId: dto.teacherId,
            subjectId: item.subjectId,
            classroomId: item.classroomId,
            academicYearId: dto.academicYearId,
          },
        });
        existingSet.add(key);
        created += 1;
      } catch {
        errors.push({ line, message: 'Création impossible' });
      }
    }

    return { total: dto.assignments.length, created, errors };
  }

  async findAll(establishmentId: string, actor?: RequestActor) {
    // Périmètre enseignant : ses affectations uniquement.
    if (actor?.role === 'TEACHER') {
      return this.findMine(actor.id, establishmentId);
    }
    return this.prisma.teacherAssignment.findMany({
      where: { establishmentId, isActive: true },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        subject: { select: { id: true, name: true } },
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true, isCurrent: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Affectations du compte enseignant connecté (« Mes classes »). */
  async findMine(userId: string, establishmentId: string) {
    const teacherId = await resolveTeacherId(
      this.prisma,
      userId,
      establishmentId,
    );
    return listTeacherAssignments(this.prisma, teacherId, establishmentId);
  }

  async remove(id: string, establishmentId: string) {
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: { id, establishmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Affectation introuvable');
    }

    return this.prisma.teacherAssignment.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
