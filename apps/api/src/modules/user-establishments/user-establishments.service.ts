import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
import { ListMembersQuery } from './dto/list-members.query.js';
import { LookupAccountsQuery } from './dto/lookup-accounts.query.js';
import {
  containsInsensitive,
  paginate,
  parseListQuery,
} from '../../common/helpers/list-query.js';
import { NotificationsService } from '../notifications/notifications.service.js';

const MEMBER_SELECT = {
  id: true,
  role: true,
  isActive: true,
  createdAt: true,
  user: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
};

/**
 * Gestion des membres d'un établissement (matrice : DIRECTOR uniquement).
 * Règle SaaS : un utilisateur appartient à UN SEUL établissement.
 */
@Injectable()
export class UserEstablishmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Liste avec recherche et pagination : `?search=&role=&page=&limit=`.
   * Sans param → tableau brut historique (compat frontend).
   * Avec param → `{ data, pagination }`.
   */
  async findMembers(establishmentId: string, query: ListMembersQuery = {}) {
    const parsed = parseListQuery({
      page: query.page,
      limit: query.limit,
      search: query.search,
      hasFilter: query.role !== undefined,
    });
    if (!parsed.paginated) {
      return this.prisma.userEstablishment.findMany({
        where: { establishmentId, isActive: true },
        select: MEMBER_SELECT,
        orderBy: { user: { lastName: 'asc' } },
      });
    }

    const where: Record<string, unknown> = {
      establishmentId,
      isActive: true,
    };
    if (query.role) where.role = query.role;
    if (parsed.search) {
      const match = containsInsensitive(parsed.search);
      where.OR = [
        { user: { firstName: match } },
        { user: { lastName: match } },
        { user: { email: match } },
      ];
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.userEstablishment.count({ where }),
      this.prisma.userEstablishment.findMany({
        where,
        select: MEMBER_SELECT,
        orderBy: { user: { lastName: 'asc' } },
        skip: parsed.skip,
        take: parsed.limit,
      }),
    ]);
    return paginate(items, total, parsed.page, parsed.limit);
  }

  /**
   * Comptes candidats pour un sélecteur de liaison dossier → compte.
   * Renvoie un tableau brut (pas de pagination).
   */
  async lookupAccounts(
    establishmentId: string,
    query: LookupAccountsQuery = {},
  ) {
    const where: Record<string, unknown> = {
      establishmentId,
      isActive: true,
    };
    if (query.role) where.role = query.role;
    if (query.search) {
      const match = containsInsensitive(query.search);
      where.OR = [
        { user: { firstName: match } },
        { user: { lastName: match } },
        { user: { email: match } },
      ];
    }
    if (query.excludeLinked && query.role) {
      const linked = await this.linkedUserIds(
        establishmentId,
        query.role,
        query.includeUserId,
      );
      if (linked.length > 0) where.userId = { notIn: linked };
    }

    const items = await this.prisma.userEstablishment.findMany({
      where,
      select: MEMBER_SELECT,
      orderBy: { user: { lastName: 'asc' } },
      take: 20,
    });

    if (
      query.includeUserId &&
      !items.some((item) => item.user.id === query.includeUserId)
    ) {
      const current = await this.prisma.userEstablishment.findFirst({
        where: { establishmentId, userId: query.includeUserId },
        select: MEMBER_SELECT,
      });
      if (current) return [current, ...items];
    }

    return items;
  }

  /** Identifiants de comptes déjà liés à un dossier (par type de rôle). */
  private async linkedUserIds(
    establishmentId: string,
    role: Role,
    exceptUserId?: string,
  ): Promise<string[]> {
    const where = {
      establishmentId,
      userId: exceptUserId ? { not: exceptUserId } : { not: null },
    };
    const rows =
      role === Role.TEACHER
        ? await this.prisma.teacher.findMany({
            where,
            select: { userId: true },
          })
        : role === Role.PARENT
          ? await this.prisma.parent.findMany({
              where,
              select: { userId: true },
            })
          : await this.prisma.student.findMany({
              where,
              select: { userId: true },
            });
    return rows
      .map((row) => row.userId)
      .filter((id): id is string => !!id);
  }

  async addMember(establishmentId: string, dto: AddMemberDto) {
    if (dto.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('Rôle non attribuable ici');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.isActive) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const existing = await this.prisma.userEstablishment.findFirst({
      where: { userId: user.id, isActive: true },
    });
    if (existing) {
      throw new ConflictException(
        'Cet utilisateur appartient déjà à un établissement',
      );
    }

    const membership = await this.prisma.userEstablishment.create({
      data: { userId: user.id, establishmentId, role: dto.role },
      select: MEMBER_SELECT,
    });

    const establishment = await this.prisma.establishment.findUnique({
      where: { id: establishmentId },
      select: { name: true },
    });
    await this.notificationsService.notify(establishmentId, [user.id], {
      type: 'MEMBRE',
      title: `Bienvenue — ${establishment?.name ?? 'votre établissement'}`,
      message: `Votre rôle : ${dto.role}`,
      link: '/dashboard',
    });

    return membership;
  }

  async updateRole(
    establishmentId: string,
    actorUserId: string,
    id: string,
    dto: UpdateMemberRoleDto,
  ) {
    if (dto.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('Rôle non attribuable ici');
    }

    const membership = await this.prisma.userEstablishment.findFirst({
      where: { id, establishmentId },
    });
    if (!membership) {
      throw new NotFoundException('Membre introuvable');
    }
    if (membership.userId === actorUserId) {
      throw new BadRequestException(
        'Vous ne pouvez pas modifier votre propre rôle',
      );
    }

    return this.prisma.userEstablishment.update({
      where: { id },
      data: { role: dto.role },
      select: MEMBER_SELECT,
    });
  }

  async remove(establishmentId: string, actorUserId: string, id: string) {
    const membership = await this.prisma.userEstablishment.findFirst({
      where: { id, establishmentId },
    });
    if (!membership) {
      throw new NotFoundException('Membre introuvable');
    }
    if (membership.userId === actorUserId) {
      throw new BadRequestException(
        'Vous ne pouvez pas retirer votre propre accès',
      );
    }

    return this.prisma.userEstablishment.delete({ where: { id } });
  }
}
