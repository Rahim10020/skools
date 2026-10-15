import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateClassroomDto } from './dto/create-classroom.dto.js';
import { UpdateClassroomDto } from './dto/update-classroom.dto.js';
import { ListClassroomsQuery } from './dto/list-classrooms.query.js';
import {
  containsInsensitive,
  paginate,
  parseListQuery,
} from '../../../common/helpers/list-query.js';

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

  /**
   * Liste avec recherche et pagination : `?search=&levelId=&seriesId=&academicYearId=&page=&limit=`.
   * Sans param → tableau brut historique (compat frontend).
   * Avec param → `{ data, pagination }`.
   */
  async findAll(establishmentId: string, query: ListClassroomsQuery = {}) {
    const include = {
      academicYear: { select: { id: true, name: true, isCurrent: true } },
      level: { select: { id: true, name: true } },
      series: { select: { id: true, name: true } },
    };
    const parsed = parseListQuery({
      page: query.page,
      limit: query.limit,
      search: query.search,
      hasFilter:
        query.levelId !== undefined ||
        query.seriesId !== undefined ||
        query.academicYearId !== undefined,
    });
    if (!parsed.paginated) {
      return this.prisma.classroom.findMany({
        where: { establishmentId, isActive: true },
        include,
        orderBy: { name: 'asc' },
      });
    }

    const where: Record<string, unknown> = {
      establishmentId,
      isActive: true,
    };
    if (parsed.search) where.name = containsInsensitive(parsed.search);
    if (query.levelId) where.levelId = query.levelId;
    if (query.seriesId) where.seriesId = query.seriesId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.classroom.count({ where }),
      this.prisma.classroom.findMany({
        where,
        include,
        orderBy: { name: 'asc' },
        skip: parsed.skip,
        take: parsed.limit,
      }),
    ]);
    return paginate(items, total, parsed.page, parsed.limit);
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
