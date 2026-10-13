import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Rôles autorisés sur un controller (défaut) ou une route (surcharge).
 * Absence de décorateur = route accessible à tout utilisateur authentifié.
 * SUPER_ADMIN n'est jamais inclus sur les controllers d'établissement
 * (matrice : aucun accès aux données pédagogiques hors impersonation).
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
