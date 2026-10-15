import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { UpdateSubjectDto } from './dto/update-subject.dto.js';
import { ListSubjectsQuery } from './dto/list-subjects.query.js';
import {
  containsInsensitive,
  paginate,
  parseListQuery,
} from '../../../common/helpers/list-query.js';

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

  /** Liste avec recherche et pagination : `?search=&page=&limit=` (nom + code, sans param → tableau brut). */
  async findAll(establishmentId: string, query: ListSubjectsQuery = {}) {
    const parsed = parseListQuery({
      page: query.page,
      limit: query.limit,
      search: query.search,
      hasFilter: false,
    });
    if (!parsed.paginated) {
      return this.prisma.subject.findMany({
        where: { establishmentId, isActive: true },
        orderBy: { name: 'asc' },
      });
    }
    const where: Record<string, unknown> = {
      establishmentId,
      isActive: true,
    };
    if (parsed.search) {
      const match = containsInsensitive(parsed.search);
      where.OR = [{ name: match }, { code: match }];
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.subject.count({ where }),
      this.prisma.subject.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: parsed.skip,
        take: parsed.limit,
      }),
    ]);
    return paginate(items, total, parsed.page, parsed.limit);
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