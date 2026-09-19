import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreatePeriodDto } from './dto/create-period.dto.js';
import { UpdatePeriodDto } from './dto/update-period.dto.js';

@Injectable()
export class PeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreatePeriodDto) {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, establishmentId, isActive: true },
    });

    if (!academicYear) {
      throw new BadRequestException('Année académique invalide');
    }

    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException(
        'La date de début doit être antérieure à la date de fin',
      );
    }

    return this.prisma.period.create({
      data: {
        establishmentId,
        academicYearId: dto.academicYearId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        order: dto.order ?? 0,
      },
      include: {
        academicYear: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(establishmentId: string) {
    return this.prisma.period.findMany({
      where: { establishmentId, isActive: true },
      include: {
        academicYear: { select: { id: true, name: true, isCurrent: true } },
      },
      orderBy: [{ academicYear: { startDate: 'desc' } }, { order: 'asc' }],
    });
  }

  async findOne(id: string, establishmentId: string) {
    const period = await this.prisma.period.findFirst({
      where: { id, establishmentId },
      include: {
        academicYear: { select: { id: true, name: true } },
      },
    });

    if (!period) {
      throw new NotFoundException('Période introuvable');
    }

    return period;
  }

  async update(id: string, establishmentId: string, dto: UpdatePeriodDto) {
    await this.findOne(id, establishmentId);

    if (dto.academicYearId) {
      const academicYear = await this.prisma.academicYear.findFirst({
        where: { id: dto.academicYearId, establishmentId, isActive: true },
      });
      if (!academicYear) {
        throw new BadRequestException('Année académique invalide');
      }
    }

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate)) {
        throw new BadRequestException(
          'La date de début doit être antérieure à la date de fin',
        );
      }
    }

    return this.prisma.period.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: {
        academicYear: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.period.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
