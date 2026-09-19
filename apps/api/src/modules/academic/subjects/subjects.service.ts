import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { UpdateSubjectDto } from './dto/update-subject.dto.js';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        establishmentId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
      },
    });
  }

  async findAll(establishmentId: string) {
    return this.prisma.subject.findMany({
      where: { establishmentId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, establishmentId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, establishmentId },
    });

    if (!subject) {
      throw new NotFoundException('Matière introuvable');
    }

    return subject;
  }

  async update(id: string, establishmentId: string, dto: UpdateSubjectDto) {
    await this.findOne(id, establishmentId);

    return this.prisma.subject.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.subject.update({
      where: { id },
      data: { isActive: false },
    });
  }
}