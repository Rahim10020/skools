import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto.js';
import { EnrollmentStatus } from '@prisma/client';
import {
  assignedClassroomIds,
  assertClassroomAssigned,
  resolveTeacherScope,
} from '../../common/helpers/teacher-scope.js';
import type { RequestActor } from '../../common/types/request-actor.js';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.enrollment.create({
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
          },
        },
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(establishmentId: string, actor?: RequestActor) {
    // Périmètre enseignant : inscrits de ses classes (registre d'appel/notes).
    let classroomIds: string[] | undefined;
    const scope = await resolveTeacherScope(this.prisma, establishmentId, actor);
    if (scope) classroomIds = [...assignedClassroomIds(scope)];

    return this.prisma.enrollment.findMany({
      where: {
        establishmentId,
        isActive: true,
        ...(classroomIds ? { classroomId: { in: classroomIds } } : {}),
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
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true, isCurrent: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
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
