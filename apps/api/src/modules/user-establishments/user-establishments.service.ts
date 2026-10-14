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

  async findMembers(establishmentId: string) {
    return this.prisma.userEstablishment.findMany({
      where: { establishmentId, isActive: true },
      select: MEMBER_SELECT,
      orderBy: { user: { lastName: 'asc' } },
    });
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
