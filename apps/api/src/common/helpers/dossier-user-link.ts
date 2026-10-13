import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

type DossierModel = 'teacher' | 'student' | 'parent';

const EXPECTED_ROLE: Record<DossierModel, Role> = {
  teacher: Role.TEACHER,
  student: Role.STUDENT,
  parent: Role.PARENT,
};

const DOSSIER_LABEL: Record<DossierModel, string> = {
  teacher: 'enseignant',
  student: 'élève',
  parent: 'parent',
};

/**
 * Garde-fou partagé de l'onboarding compte → dossier (§2 roadmap).
 * Vérifie que le `userId` optionnel désigne un compte réel, membre actif
 * de l'établissement, avec le rôle attendu, et non déjà lié à un dossier.
 */
export async function validateDossierUserLink(
  prisma: PrismaService,
  model: DossierModel,
  establishmentId: string,
  userId: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new NotFoundException('Compte utilisateur introuvable');
  }

  const membership = await prisma.userEstablishment.findFirst({
    where: { userId, establishmentId, isActive: true },
  });
  if (!membership) {
    throw new BadRequestException(
      "Ce compte n'appartient pas à cet établissement",
    );
  }

  const expected = EXPECTED_ROLE[model];
  if (membership.role !== expected) {
    throw new BadRequestException(
      `Ce compte a le rôle ${membership.role}, attendu ${expected} pour un dossier ${DOSSIER_LABEL[model]}`,
    );
  }

  const alreadyLinked = await (prisma as any)[model].findUnique({
    where: { userId },
  });
  if (alreadyLinked) {
    throw new ConflictException('Ce compte est déjà lié à un dossier');
  }
}
