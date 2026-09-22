import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateExamDto } from './dto/create-exam.dto.js';
import { UpdateExamDto } from './dto/update-exam.dto.js';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateExamDto) {
    // Vérifications de base
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, establishmentId, isActive: true },
    });
    if (!academicYear) throw new BadRequestException('Année scolaire invalide');

    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, establishmentId, isActive: true },
    });
    if (!subject) throw new BadRequestException('Matière invalide');

    if (dto.periodId) {
      const period = await this.prisma.period.findFirst({
        where: { id: dto.periodId, establishmentId, isActive: true },
      });
      if (!period) throw new BadRequestException('Période invalide');
    }

    if (dto.classroomId) {
      const classroom = await this.prisma.classroom.findFirst({
        where: { id: dto.classroomId, establishmentId, isActive: true },
      });
      if (!classroom) throw new BadRequestException('Classe invalide');
    }

    return this.prisma.exam.create({
      data: {
        establishmentId,
        academicYearId: dto.academicYearId,
        periodId: dto.periodId,
        subjectId: dto.subjectId,
        classroomId: dto.classroomId,
        name: dto.name,
        type: dto.type,
        examDate: dto.examDate ? new Date(dto.examDate) : undefined,
        maxScore: dto.maxScore ?? 20,
        coefficient: dto.coefficient ?? 1,
        isPublished: dto.isPublished ?? false,
      },
      include: {
        subject: { select: { id: true, name: true } },
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        period: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(establishmentId: string) {
    return this.prisma.exam.findMany({
      where: { establishmentId, isActive: true },
      include: {
        subject: { select: { id: true, name: true } },
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        period: { select: { id: true, name: true } },
      },
      orderBy: { examDate: 'desc' },
    });
  }

  async findOne(id: string, establishmentId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, establishmentId },
      include: {
        subject: true,
        classroom: true,
        academicYear: true,
        period: true,
      },
    });

    if (!exam) throw new NotFoundException('Examen introuvable');
    return exam;
  }

  async update(id: string, establishmentId: string, dto: UpdateExamDto) {
    await this.findOne(id, establishmentId);

    return this.prisma.exam.update({
      where: { id },
      data: {
        ...dto,
        examDate: dto.examDate ? new Date(dto.examDate) : undefined,
      },
      include: {
        subject: { select: { id: true, name: true } },
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        period: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.exam.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
