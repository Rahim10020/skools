import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { RequestActor } from '../types/request-actor.js';

/**
 * Périmètre famille (STUDENT / PARENT), partagé par discipline,
 * présences, notes, EDT et inscriptions (§1 roadmap).
 * - STUDENT : lui-même (dossier lié par `userId`).
 * - PARENT : ses enfants (liaisons `parent-students`).
 */

/** IDs d'élèves visibles : lui-même (STUDENT) ou ses enfants (PARENT). */
export async function resolveVisibleStudentIds(
  prisma: PrismaService,
  actor: RequestActor,
  establishmentId: string,
): Promise<string[]> {
  if (actor.role === 'STUDENT') {
    const student = await prisma.student.findFirst({
      where: { userId: actor.id, establishmentId },
    });
    return student ? [student.id] : [];
  }

  const parent = await prisma.parent.findFirst({
    where: { userId: actor.id, establishmentId, isActive: true },
  });
  if (!parent) return [];
  const links = await prisma.parentStudent.findMany({
    where: { parentId: parent.id },
    select: { studentId: true },
  });
  return links.map((link) => link.studentId);
}

/** 403 si l'élève n'est pas visible pour l'acteur (lui-même / ses enfants). */
export async function assertStudentVisible(
  prisma: PrismaService,
  actor: RequestActor,
  studentId: string,
  establishmentId: string,
) {
  if (actor.role === 'STUDENT') {
    const student = await prisma.student.findFirst({
      where: { id: studentId, establishmentId },
    });
    if (!student || student.userId !== actor.id) {
      throw new ForbiddenException('Accès refusé');
    }
    return;
  }

  const parent = await prisma.parent.findFirst({
    where: { userId: actor.id, establishmentId, isActive: true },
  });
  const link = parent
    ? await prisma.parentStudent.findUnique({
        where: {
          parentId_studentId: { parentId: parent.id, studentId },
        },
      })
    : null;
  if (!link) {
    throw new ForbiddenException('Accès refusé');
  }
}

/** Classes d'inscription actives des élèves donnés (contexte EDT / appel). */
export async function resolveEnrolledClassroomIds(
  prisma: PrismaService,
  establishmentId: string,
  studentIds: string[],
): Promise<string[]> {
  if (studentIds.length === 0) return [];
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: { in: studentIds }, establishmentId, isActive: true },
    select: { classroomId: true },
  });
  return [...new Set(enrollments.map((e) => e.classroomId))];
}
