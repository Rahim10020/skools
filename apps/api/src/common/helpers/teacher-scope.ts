import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { RequestActor } from '../types/request-actor.js';

export interface TeacherAssignmentScope {
  teacherId: string;
  classroomId: string;
  subjectId: string;
  academicYearId: string;
}

const ASSIGNMENT_INCLUDE = {
  teacher: { select: { id: true, firstName: true, lastName: true } },
  subject: { select: { id: true, name: true } },
  classroom: { select: { id: true, name: true } },
  academicYear: { select: { id: true, name: true, isCurrent: true } },
} as const;

/** Dossier enseignant du compte connecté, ou 404 (rôle TEACHER sans dossier lié). */
export async function resolveTeacherId(
  prisma: PrismaService,
  userId: string,
  establishmentId: string,
): Promise<string> {
  const teacher = await prisma.teacher.findFirst({
    where: { userId, establishmentId },
    select: { id: true },
  });
  if (!teacher) {
    throw new NotFoundException('Dossier enseignant introuvable pour ce compte');
  }
  return teacher.id;
}

/** Affectations actives de l'enseignant (son périmètre : classes + matières). */
export async function listTeacherAssignments(
  prisma: PrismaService,
  teacherId: string,
  establishmentId: string,
) {
  return prisma.teacherAssignment.findMany({
    where: { teacherId, establishmentId, isActive: true },
    include: ASSIGNMENT_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}

/** Tuples (matière, classe, année) du périmètre enseignant. */
export function assignmentTuples(
  assignments: TeacherAssignmentScope[],
): Set<string> {
  return new Set(
    assignments.map((a) => `${a.subjectId}|${a.classroomId}|${a.academicYearId}`),
  );
}

/**
 * Un examen mono-classe est dans le périmètre si son tuple exact est assigné.
 * Un examen multi-classes (classroomId null) est dans le périmètre si la
 * matière est assignée à l'enseignant pour la même année (toutes classes).
 */
export function examInScope(
  assignments: TeacherAssignmentScope[],
  exam: { subjectId: string; classroomId: string | null; academicYearId: string },
): boolean {
  if (exam.classroomId) {
    return assignments.some(
      (a) =>
        a.subjectId === exam.subjectId &&
        a.classroomId === exam.classroomId &&
        a.academicYearId === exam.academicYearId,
    );
  }
  return assignments.some(
    (a) =>
      a.subjectId === exam.subjectId && a.academicYearId === exam.academicYearId,
  );
}

/** Classes assignées à l'enseignant (périmètre appel / EDT / inscriptions). */
export function assignedClassroomIds(
  assignments: TeacherAssignmentScope[],
): Set<string> {
  return new Set(assignments.map((a) => a.classroomId));
}

/**
 * Résout le périmètre d'un acteur TEACHER : ses affectations actives.
 * Retourne `null` pour les autres rôles (pas de restriction).
 */
export async function resolveTeacherScope(
  prisma: PrismaService,
  establishmentId: string,
  actor?: RequestActor,
): Promise<TeacherAssignmentScope[] | null> {
  if (actor?.role !== 'TEACHER') return null;
  const teacherId = await resolveTeacherId(prisma, actor.id, establishmentId);
  const assignments = await listTeacherAssignments(
    prisma,
    teacherId,
    establishmentId,
  );
  return assignments;
}

/** 403 si la classe n'est pas assignée à l'enseignant. */
export function assertClassroomAssigned(
  assignments: TeacherAssignmentScope[],
  classroomId: string,
) {
  if (!assignedClassroomIds(assignments).has(classroomId)) {
    throw new ForbiddenException('Classe hors de votre périmètre');
  }
}
