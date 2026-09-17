import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateCycleDto } from './dto/create-cycle.dto.js';
import { UpdateCycleDto } from './dto/update-cycle.dto.js';

@Injectable()
export class CyclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateCycleDto) {
    return this.prisma.cycle.create({
      data: {
        establishmentId,
        name: dto.name,
        order: dto.order ?? 0,
      },
    });
  }

  async findAll(establishmentId: string) {
    return this.prisma.cycle.findMany({
      where: { establishmentId, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string, establishmentId: string) {
    const cycle = await this.prisma.cycle.findFirst({
      where: { id, establishmentId },
    });

    if (!cycle) {
      throw new NotFoundException('Cycle introuvable');
    }

    return cycle;
  }

  async update(id: string, establishmentId: string, dto: UpdateCycleDto) {
    await this.findOne(id, establishmentId);

    return this.prisma.cycle.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.cycle.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
