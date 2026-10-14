import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAttendanceDto } from './dto/create-attendance.dto.js';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto.js';
import { AttendanceStatus } from '@prisma/client';
import type { RequestActor } from '../../common/types/request-actor.js';
import {
  assertClassroomAssigned,
  resolveTeacherScope,
} from '../../common/helpers/teacher-scope.js';

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    establishmentId: string,
    userId: string,
    dto: CreateAttendanceDto,
    actor?: RequestActor,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, establishmentId, isActive: true },
    });
    if (!student) throw new BadRequestException('Élève invalide');

    const classroom = await this.prisma.classroom.findFirst({
      where: { id: dto.classroomId, establishmentId, isActive: true },
    });
    if (!classroom) throw new BadRequestException('Classe invalide');

    // Périmètre enseignant : appel restreint à ses classes.
    const scope = await resolveTeacherScope(this.prisma, establishmentId, actor);
    if (scope) assertClassroomAssigned(scope, dto.classroomId);

    return this.prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: dto.studentId,
          date: new Date(dto.date),
        },
      },
      update: {
        status: dto.status ?? AttendanceStatus.PRESENT,
        notes: dto.notes,
        recordedById: userId,
        classroomId: dto.classroomId,
      },
      create: {
        establishmentId,
        studentId: dto.studentId,
        classroomId: dto.classroomId,
        date: new Date(dto.date),
        status: dto.status ?? AttendanceStatus.PRESENT,
        notes: dto.notes,
        recordedById: userId,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async bulkCreate(
    establishmentId: string,
    userId: string,
    dto: BulkAttendanceDto,
    actor?: RequestActor,
  ) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: dto.classroomId, establishmentId, isActive: true },
    });
    if (!classroom) throw new BadRequestException('Classe invalide');

    const scope = await resolveTeacherScope(this.prisma, establishmentId, actor);
    if (scope) assertClassroomAssigned(scope, dto.classroomId);

    const results = [];

    for (const item of dto.attendances) {
      const record = await this.prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: item.studentId,
            date: new Date(dto.date),
          },
        },
        update: {
          status: item.status,
          notes: item.notes,
          recordedById: userId,
          classroomId: dto.classroomId,
        },
        create: {
          establishmentId,
          studentId: item.studentId,
          classroomId: dto.classroomId,
          date: new Date(dto.date),
          status: item.status,
          notes: item.notes,
          recordedById: userId,
        },
      });
      results.push(record);
    }

    return results;
  }

  async findByClassroomAndDate(
    establishmentId: string,
    classroomId: string,
    date: string,
    actor?: RequestActor,
  ) {
    // Périmètre élève/parent : inscrit (ou enfant inscrit) dans la classe.
    if (actor?.role === 'STUDENT' || actor?.role === 'PARENT') {
      const studentIds = await this.resolveVisibleStudentIds(
        actor,
        establishmentId,
      );
      const enrolled = await this.prisma.enrollment.findFirst({
        where: {
          studentId: { in: studentIds },
          classroomId,
          establishmentId,
          isActive: true,
        },
      });
      if (studentIds.length === 0 || !enrolled) {
        throw new ForbiddenException('Accès refusé');
      }
    }

    // Périmètre enseignant : appel restreint à ses classes.
    if (actor?.role === 'TEACHER') {
      const scope = await resolveTeacherScope(
        this.prisma,
        establishmentId,
        actor,
      );
      if (scope) assertClassroomAssigned(scope, classroomId);
    }

    return this.prisma.attendance.findMany({
      where: {
        establishmentId,
        classroomId,
        date: new Date(date),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
      },
      orderBy: [
        { student: { lastName: 'asc' } },
        { student: { firstName: 'asc' } },
      ],
    });
  }

  async findByStudent(studentId: string, establishmentId: string) {
    return this.prisma.attendance.findMany({
      where: { studentId, establishmentId },
      orderBy: { date: 'desc' },
    });
  }

  /** IDs d'élèves visibles : lui-même (STUDENT) ou ses enfants (PARENT). */
  private async resolveVisibleStudentIds(
    actor: RequestActor,
    establishmentId: string,
  ): Promise<string[]> {
    if (actor.role === 'STUDENT') {
      const student = await this.prisma.student.findFirst({
        where: { userId: actor.id, establishmentId },
      });
      return student ? [student.id] : [];
    }

    const parent = await this.prisma.parent.findFirst({
      where: { userId: actor.id, establishmentId, isActive: true },
    });
    if (!parent) return [];
    const links = await this.prisma.parentStudent.findMany({
      where: { parentId: parent.id },
      select: { studentId: true },
    });
    return links.map((link) => link.studentId);
  }
}
