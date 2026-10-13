import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

/**
 * Vérifie le rôle du JWT (req.user.role, posé par JwtStrategy).
 * À combiner avec JwtAuthGuard : @UseGuards(JwtAuthGuard, RolesGuard).
 * Sans rôle (compte sans établissement) ou rôle non listé → false (403).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const role = request.user?.role as Role | undefined;
    if (!role) return false;
    return required.includes(role);
  }
}
