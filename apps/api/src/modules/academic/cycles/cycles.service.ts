import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateCycleDto } from './dto/create-cycle.dto.js';
import { UpdateCycleDto } from './dto/update-cycle.dto.js';
import { ListCyclesQuery } from './dto/list-cycles.query.js';
import {
  containsInsensitive,
  paginate,
  parseListQuery,
} from '../../../common/helpers/list-query.js';

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

  /** Liste avec recherche et pagination : `?search=&page=&limit=` (sans param → tableau brut). */
  async findAll(establishmentId: string, query: ListCyclesQuery = {}) {
    const parsed = parseListQuery({
      page: query.page,
      limit: query.limit,
      search: query.search,
      hasFilter: false,
    });
    if (!parsed.paginated) {
      return this.prisma.cycle.findMany({
        where: { establishmentId, isActive: true },
        orderBy: { order: 'asc' },
      });
    }
    const where: Record<string, unknown> = {
      establishmentId,
      isActive: true,
    };
    if (parsed.search) where.name = containsInsensitive(parsed.search);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.cycle.count({ where }),
      this.prisma.cycle.findMany({
        where,
        orderBy: { order: 'asc' },
        skip: parsed.skip,
        take: parsed.limit,
      }),
    ]);
    return paginate(items, total, parsed.page, parsed.limit);
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
