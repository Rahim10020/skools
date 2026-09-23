import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto.js';

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

  async findAll(establishmentId: string) {
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
