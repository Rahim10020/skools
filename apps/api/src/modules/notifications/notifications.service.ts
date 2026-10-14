import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface NotifyInput {
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
}

/**
 * Notifications par destinataire (§5 roadmap).
 * Lecture : `findMine`, `unreadCount`, `markRead`, `markAllRead`.
 * Émission : `notify()` appelé par discipline, inscriptions, notes, membres.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crée une notification pour chaque destinataire (dédupliqués, existants). */
  async notify(
    establishmentId: string,
    userIds: (string | null | undefined)[],
    input: NotifyInput,
  ) {
    const recipients = [...new Set(userIds.filter(Boolean))] as string[];
    if (recipients.length === 0) return [];

    // Ne notifie que les comptes actifs (un userId lié peut être désactivé).
    const users = await this.prisma.user.findMany({
      where: { id: { in: recipients }, isActive: true },
      select: { id: true },
    });

    return this.prisma.notification.createMany({
      data: users.map((user) => ({
        establishmentId,
        userId: user.id,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
      })),
    });
  }

  async findMine(userId: string, establishmentId: string) {
    return this.prisma.notification.findMany({
      where: { userId, establishmentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async unreadCount(userId: string, establishmentId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, establishmentId, readAt: null },
    });
    return { count };
  }

  async markRead(id: string, userId: string, establishmentId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, establishmentId },
    });
    if (!notification) {
      throw new NotFoundException('Notification introuvable');
    }
    if (notification.readAt) return notification;
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string, establishmentId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, establishmentId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
