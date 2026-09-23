import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateDisciplineDto } from './dto/create-discipline.dto.js';
import { UpdateDisciplineDto } from './dto/update-discipline.dto.js';
import { DisciplineStatus } from '@prisma/client';

@Injectable()
export class DisciplineService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    establishmentId: string,
    userId: string,
    dto: CreateDisciplineDto,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, establishmentId, isActive: true },
    });
    if (!student) throw new BadRequestException('Élève invalide');

    return this.prisma.disciplineRecord.create({
      data: {
        establishmentId,
        studentId: dto.studentId,
        reportedById: userId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        incidentDate: new Date(dto.incidentDate),
        status: dto.status ?? DisciplineStatus.PENDING,
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
        reportedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async findAll(establishmentId: string) {
    return this.prisma.disciplineRecord.findMany({
      where: { establishmentId, isActive: true },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
        reportedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { incidentDate: 'desc' },
    });
  }

  async findByStudent(studentId: string, establishmentId: string) {
    return this.prisma.disciplineRecord.findMany({
      where: { studentId, establishmentId, isActive: true },
      orderBy: { incidentDate: 'desc' },
    });
  }

  async findOne(id: string, establishmentId: string) {
    const record = await this.prisma.disciplineRecord.findFirst({
      where: { id, establishmentId },
      include: {
        student: true,
        reportedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!record) throw new NotFoundException('Fiche disciplinaire introuvable');
    return record;
  }

  async update(id: string, establishmentId: string, dto: UpdateDisciplineDto) {
    await this.findOne(id, establishmentId);

    return this.prisma.disciplineRecord.update({
      where: { id },
      data: {
        ...dto,
        incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : undefined,
        resolvedAt: dto.resolvedAt ? new Date(dto.resolvedAt) : undefined,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.disciplineRecord.update({
      where: { id },
      data: { isActive: false, status: DisciplineStatus.CANCELLED },
    });
  }
}
