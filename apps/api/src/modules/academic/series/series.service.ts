import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateSeriesDto } from './dto/create-series.dto.js';
import { UpdateSeriesDto } from './dto/update-series.dto.js';

@Injectable()
export class SeriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateSeriesDto) {
    if (dto.levelId) {
      const level = await this.prisma.level.findFirst({
        where: { id: dto.levelId, establishmentId, isActive: true },
      });

      if (!level) {
        throw new BadRequestException('Niveau invalide pour cet établissement');
      }
    }

    return this.prisma.series.create({
      data: {
        establishmentId,
        name: dto.name,
        levelId: dto.levelId,
      },
    });
  }

  async findAll(establishmentId: string) {
    return this.prisma.series.findMany({
      where: { establishmentId, isActive: true },
      include: {
        level: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, establishmentId: string) {
    const series = await this.prisma.series.findFirst({
      where: { id, establishmentId },
      include: {
        level: {
          select: { id: true, name: true },
        },
      },
    });

    if (!series) {
      throw new NotFoundException('Série introuvable');
    }

    return series;
  }

  async update(id: string, establishmentId: string, dto: UpdateSeriesDto) {
    await this.findOne(id, establishmentId);

    if (dto.levelId) {
      const level = await this.prisma.level.findFirst({
        where: { id: dto.levelId, establishmentId, isActive: true },
      });

      if (!level) {
        throw new BadRequestException('Niveau invalide pour cet établissement');
      }
    }

    return this.prisma.series.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.series.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
