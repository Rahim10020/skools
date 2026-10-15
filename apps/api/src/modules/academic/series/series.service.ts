import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateSeriesDto } from './dto/create-series.dto.js';
import { UpdateSeriesDto } from './dto/update-series.dto.js';
import { ListSeriesQuery } from './dto/list-series.query.js';
import {
  containsInsensitive,
  paginate,
  parseListQuery,
} from '../../../common/helpers/list-query.js';

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

  /** Liste avec recherche et pagination : `?search=&levelId=&page=&limit=` (sans param → tableau brut). */
  async findAll(establishmentId: string, query: ListSeriesQuery = {}) {
    const include = { level: { select: { id: true, name: true } } };
    const parsed = parseListQuery({
      page: query.page,
      limit: query.limit,
      search: query.search,
      hasFilter: query.levelId !== undefined,
    });
    if (!parsed.paginated) {
      return this.prisma.series.findMany({
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
    const [total, items] = await this.prisma.$transaction([
      this.prisma.series.count({ where }),
      this.prisma.series.findMany({
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
