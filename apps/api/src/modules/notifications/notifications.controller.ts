import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

// Tous les rôles d'établissement (matrice : cloche dans le header).
// SUPER_ADMIN exclu : sans établissement, périmètre plateforme (Phase 7+).
const ESTABLISHMENT_ROLES = [
  Role.DIRECTOR,
  Role.ADMIN,
  Role.CENSEUR,
  Role.BIBLIOTECAIRE,
  Role.SURVEILLANT,
  Role.TEACHER,
  Role.STUDENT,
  Role.PARENT,
];

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ESTABLISHMENT_ROLES)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(@Request() req: any) {
    return this.notificationsService.findMine(
      req.user.id,
      req.user.establishmentId,
    );
  }

  @Get('unread-count')
  unreadCount(@Request() req: any) {
    return this.notificationsService.unreadCount(
      req.user.id,
      req.user.establishmentId,
    );
  }

  @Post('read-all')
  markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(
      req.user.id,
      req.user.establishmentId,
    );
  }

  @Patch(':id/read')
  markRead(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.notificationsService.markRead(
      id,
      req.user.id,
      req.user.establishmentId,
    );
  }
}
