import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { validateDossierUserLink } from '../../common/helpers/dossier-user-link.js';
import { CreateParentDto } from './dto/create-parent.dto.js';
import { UpdateParentDto } from './dto/update-parent.dto.js';
import { ListParentsQuery } from './dto/list-parents.query.js';
import {
  containsInsensitive,
  paginate,
  parseListQuery,
} from '../../common/helpers/list-query.js';

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateParentDto) {
    if (dto.userId) {
      await validateDossierUserLink(
        this.prisma,
        'parent',
        establishmentId,
        dto.userId,
      );
    }

    return this.prisma.parent.create({
      data: {
        establishmentId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        profession: dto.profession,
        userId: dto.userId,
      },
    });
  }

  /** Liste avec recherche et pagination : `?search=&page=&limit=` (nom/prénom/téléphone, sans param → tableau brut). */
  async findAll(establishmentId: string, query: ListParentsQuery = {}) {
    const parsed = parseListQuery({
      page: query.page,
      limit: query.limit,
      search: query.search,
      hasFilter: false,
    });
    if (!parsed.paginated) {
      return this.prisma.parent.findMany({
        where: { establishmentId, isActive: true },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });
    }
    const where: Record<string, unknown> = {
      establishmentId,
      isActive: true,
    };
    if (parsed.search) {
      const match = containsInsensitive(parsed.search);
      where.OR = [{ firstName: match }, { lastName: match }, { phone: match }];
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.parent.count({ where }),
      this.prisma.parent.findMany({
        where,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: parsed.skip,
        take: parsed.limit,
      }),
    ]);
    return paginate(items, total, parsed.page, parsed.limit);
  }

  async findOne(id: string, establishmentId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { id, establishmentId },
    });

    if (!parent) {
      throw new NotFoundException('Parent introuvable');
    }

    return parent;
  }

  /** Dossier parent du compte connecté (rôle PARENT). */
  async findByUserId(userId: string, establishmentId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { userId, establishmentId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!parent) {
      throw new NotFoundException('Dossier parent introuvable pour ce compte');
    }

    return parent;
  }

  async update(id: string, establishmentId: string, dto: UpdateParentDto) {
    await this.findOne(id, establishmentId);

    if (dto.userId) {
      await validateDossierUserLink(
        this.prisma,
        'parent',
        establishmentId,
        dto.userId,
      );
    }

    return this.prisma.parent.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.parent.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
