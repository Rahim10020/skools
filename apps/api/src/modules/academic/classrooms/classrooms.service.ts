import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateClassroomDto } from './dto/create-classroom.dto.js';
import { UpdateClassroomDto } from './dto/update-classroom.dto.js';

@Injectable()
export class ClassroomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateClassroomDto) {
    // Vérifie l’année académique
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, establishmentId, isActive: true },
    });
    if (!academicYear) {
      throw new BadRequestException('Année académique invalide');
    }

    // Vérifie le niveau
    const level = await this.prisma.level.findFirst({
      where: { id: dto.levelId, establishmentId, isActive: true },
    });
    if (!level) {
      throw new BadRequestException('Niveau invalide');
    }

    // Vérifie la série si fournie
    if (dto.seriesId) {
      const series = await this.prisma.series.findFirst({
        where: { id: dto.seriesId, establishmentId, isActive: true },
      });
      if (!series) {
        throw new BadRequestException('Série invalide');
      }
    }

    return this.prisma.classroom.create({
      data: {
        establishmentId,
        academicYearId: dto.academicYearId,
        levelId: dto.levelId,
        seriesId: dto.seriesId,
        name: dto.name,
        capacity: dto.capacity,
      },
      include: {
        academicYear: { select: { id: true, name: true } },
        level: { select: { id: true, name: true } },
        series: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(establishmentId: string) {
    return this.prisma.classroom.findMany({
      where: { establishmentId, isActive: true },
      include: {
        academicYear: { select: { id: true, name: true, isCurrent: true } },
        level: { select: { id: true, name: true } },
        series: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, establishmentId: string) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id, establishmentId },
      include: {
        academicYear: { select: { id: true, name: true, isCurrent: true } },
        level: { select: { id: true, name: true } },
        series: { select: { id: true, name: true } },
      },
    });

    if (!classroom) {
      throw new NotFoundException('Classe introuvable');
    }

    return classroom;
  }

  async update(id: string, establishmentId: string, dto: UpdateClassroomDto) {
    await this.findOne(id, establishmentId);

    if (dto.academicYearId) {
      const academicYear = await this.prisma.academicYear.findFirst({
        where: { id: dto.academicYearId, establishmentId, isActive: true },
      });
      if (!academicYear) {
        throw new BadRequestException('Année académique invalide');
      }
    }

    if (dto.levelId) {
      const level = await this.prisma.level.findFirst({
        where: { id: dto.levelId, establishmentId, isActive: true },
      });
      if (!level) {
        throw new BadRequestException('Niveau invalide');
      }
    }

    if (dto.seriesId) {
      const series = await this.prisma.series.findFirst({
        where: { id: dto.seriesId, establishmentId, isActive: true },
      });
      if (!series) {
        throw new BadRequestException('Série invalide');
      }
    }

    return this.prisma.classroom.update({
      where: { id },
      data: dto,
      include: {
        academicYear: { select: { id: true, name: true } },
        level: { select: { id: true, name: true } },
        series: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.classroom.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
