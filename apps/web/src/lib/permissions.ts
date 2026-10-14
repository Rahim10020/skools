/**
 * Source de vérité navigation (docs/access-matrix.md), limitée aux routes existantes.
 * Règle 9 : aucun menu vers un module non implémenté (plateforme, bibliothèque,
 * notifications, vues "Mes X" filtrées = parqués Phase 7+).
 * Le backend applique la même matrice (403) : la sidebar ne fait que masquer.
 * Paths : lib/routes.ts (aucun littéral ici).
 */
import { ROUTES } from "./routes";
import { ROLES } from "./roles";

export const ROLE_LABELS_FR: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.DIRECTOR]: "Directeur",
  [ROLES.ADMIN]: "Admin",
  [ROLES.CENSEUR]: "Censeur",
  [ROLES.BIBLIOTECAIRE]: "Bibliothécaire",
  [ROLES.SURVEILLANT]: "Surveillant",
  [ROLES.TEACHER]: "Enseignant",
  [ROLES.STUDENT]: "Élève",
  [ROLES.PARENT]: "Parent",
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "Sans rôle";
  return ROLE_LABELS_FR[role] ?? role;
}

const ACADEMIC_ROUTES = [
  ROUTES.academicYears,
  ROUTES.cycles,
  ROUTES.levels,
  ROUTES.series,
  ROUTES.subjects,
  ROUTES.periods,
  ROUTES.classrooms,
];

export const NAV_BY_ROLE: Record<string, string[]> = {
  SUPER_ADMIN: [ROUTES.dashboard, ROUTES.profil],
  DIRECTOR: [
    ROUTES.dashboard,
    ...ACADEMIC_ROUTES,
    ROUTES.structures,
    ROUTES.matieresPeriodes,
    ROUTES.examensNotes,
    ROUTES.students,
    ROUTES.teachers,
    ROUTES.parents,
    ROUTES.linkParents,
    ROUTES.teacherAssignments,
    ROUTES.enrollments,
    ROUTES.exams,
    ROUTES.grades,
    ROUTES.reportCards,
    ROUTES.attendances,
    ROUTES.schedules,
    ROUTES.discipline,
    ROUTES.users,
    ROUTES.settings,
    ROUTES.profil,
  ],
  ADMIN: [
    ROUTES.dashboard,
    ...ACADEMIC_ROUTES,
    ROUTES.structures,
    ROUTES.matieresPeriodes,
    ROUTES.students,
    ROUTES.teachers,
    ROUTES.parents,
    ROUTES.linkParents,
    ROUTES.enrollments,
    ROUTES.schedules,
    ROUTES.attendances,
    ROUTES.settings,
    ROUTES.profil,
  ],
  CENSEUR: [
    ROUTES.dashboard,
    ...ACADEMIC_ROUTES,
    ROUTES.structures,
    ROUTES.matieresPeriodes,
    ROUTES.examensNotes,
    ROUTES.students,
    ROUTES.exams,
    ROUTES.grades,
    ROUTES.reportCards,
    ROUTES.teacherAssignments,
    ROUTES.schedules,
    ROUTES.attendances,
    ROUTES.discipline,
    ROUTES.settings,
    ROUTES.profil,
  ],
  BIBLIOTECAIRE: [ROUTES.dashboard, ROUTES.students, ROUTES.profil],
  SURVEILLANT: [
    ROUTES.dashboard,
    ROUTES.attendances,
    ROUTES.discipline,
    ROUTES.schedules,
    ROUTES.students,
    ROUTES.profil,
  ],
  TEACHER: [
    ROUTES.dashboard,
    ROUTES.exams,
    ROUTES.examensNotes,
    ROUTES.grades,
    ROUTES.attendances,
    ROUTES.schedules,
    ROUTES.teacherAssignments,
    ROUTES.profil,
  ],
  STUDENT: [
    ROUTES.dashboard,
    ROUTES.schedules,
    ROUTES.myGrades,
    ROUTES.myAbsences,
    ROUTES.reportCards,
    ROUTES.discipline,
    ROUTES.profil,
  ],
  PARENT: [
    ROUTES.dashboard,
    ROUTES.myChildren,
    ROUTES.reportCards,
    ROUTES.myAbsences,
    ROUTES.discipline,
    ROUTES.schedules,
    ROUTES.profil,
  ],
};

/** Accessibles à tout utilisateur authentifié, quel que soit le rôle. */
const ALWAYS_ALLOWED: string[] = [
  ROUTES.dashboard,
  ROUTES.profil,
  ROUTES.createEstablishment,
];

export function canAccess(
  path: string,
  role: string | null | undefined,
): boolean {
  if (ALWAYS_ALLOWED.includes(path)) return true;
  if (!role) return false;
  return NAV_BY_ROLE[role]?.includes(path) ?? false;
}
