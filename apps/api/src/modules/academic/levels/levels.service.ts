import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateLevelDto } from './dto/create-level.dto.js';
import { UpdateLevelDto } from './dto/update-level.dto.js';

@Injectable()
export class LevelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateLevelDto) {
    // Vérifie que le cycle appartient bien à l’établissement
    const cycle = await this.prisma.cycle.findFirst({
      where: { id: dto.cycleId, establishmentId, isActive: true },
    });

    if (!cycle) {
      throw new BadRequestException('Cycle invalide pour cet établissement');
    }

    return this.prisma.level.create({
      data: {
        establishmentId,
        cycleId: dto.cycleId,
        name: dto.name,
        order: dto.order ?? 0,
      },
    });
  }

  async findAll(establishmentId: string) {
    return this.prisma.level.findMany({
      where: { establishmentId, isActive: true },
      include: {
        cycle: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ cycle: { order: 'asc' } }, { order: 'asc' }],
    });
  }

  async findOne(id: string, establishmentId: string) {
    const level = await this.prisma.level.findFirst({
      where: { id, establishmentId },
      include: {
        cycle: {
          select: { id: true, name: true },
        },
      },
    });

    if (!level) {
      throw new NotFoundException('Niveau introuvable');
    }

    return level;
  }

  async update(id: string, establishmentId: string, dto: UpdateLevelDto) {
    await this.findOne(id, establishmentId);

    if (dto.cycleId) {
      const cycle = await this.prisma.cycle.findFirst({
        where: { id: dto.cycleId, establishmentId, isActive: true },
      });

      if (!cycle) {
        throw new BadRequestException('Cycle invalide pour cet établissement');
      }
    }

    return this.prisma.level.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.level.update({
      where: { id },
      data: { isActive: false },
    });
  }
}