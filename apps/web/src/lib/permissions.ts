/**
 * Source de vérité navigation (docs/access-matrix.md), limitée aux routes existantes.
 * Règle 9 : aucun menu vers un module non implémenté (plateforme, bibliothèque,
 * notifications, vues "Mes X" filtrées = parqués Phase 7+).
 * Le backend applique la même matrice (403) : la sidebar ne fait que masquer.
 */

export const ROLE_LABELS_FR: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  DIRECTOR: "Directeur",
  ADMIN: "Admin",
  CENSEUR: "Censeur",
  BIBLIOTECAIRE: "Bibliothécaire",
  SURVEILLANT: "Surveillant",
  TEACHER: "Enseignant",
  STUDENT: "Élève",
  PARENT: "Parent",
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "Sans rôle";
  return ROLE_LABELS_FR[role] ?? role;
}

const ACADEMIC_ROUTES = [
  "/academic-years",
  "/cycles",
  "/levels",
  "/series",
  "/subjects",
  "/periods",
  "/classrooms",
];

export const NAV_BY_ROLE: Record<string, string[]> = {
  SUPER_ADMIN: ["/dashboard", "/profil"],
  DIRECTOR: [
    "/dashboard",
    ...ACADEMIC_ROUTES,
    "/students",
    "/teachers",
    "/parents",
    "/link-parents",
    "/teacher-assignments",
    "/enrollments",
    "/exams",
    "/grades",
    "/report-cards",
    "/attendances",
    "/schedules",
    "/discipline",
    "/users",
    "/settings",
    "/profil",
  ],
  ADMIN: [
    "/dashboard",
    ...ACADEMIC_ROUTES,
    "/students",
    "/teachers",
    "/parents",
    "/link-parents",
    "/enrollments",
    "/schedules",
    "/attendances",
    "/settings",
    "/profil",
  ],
  CENSEUR: [
    "/dashboard",
    ...ACADEMIC_ROUTES,
    "/students",
    "/exams",
    "/grades",
    "/report-cards",
    "/teacher-assignments",
    "/schedules",
    "/attendances",
    "/discipline",
    "/settings",
    "/profil",
  ],
  BIBLIOTECAIRE: ["/dashboard", "/students", "/profil"],
  SURVEILLANT: [
    "/dashboard",
    "/attendances",
    "/discipline",
    "/schedules",
    "/students",
    "/profil",
  ],
  TEACHER: [
    "/dashboard",
    "/exams",
    "/grades",
    "/attendances",
    "/schedules",
    "/teacher-assignments",
    "/profil",
  ],
  STUDENT: ["/dashboard", "/report-cards", "/schedules", "/profil"],
  PARENT: ["/dashboard", "/report-cards", "/schedules", "/profil"],
};

/** Accessibles à tout utilisateur authentifié, quel que soit le rôle. */
const ALWAYS_ALLOWED = ["/dashboard", "/profil", "/create-establishment"];

export function canAccess(path: string, role: string | null | undefined): boolean {
  if (ALWAYS_ALLOWED.includes(path)) return true;
  if (!role) return false;
  return NAV_BY_ROLE[role]?.includes(path) ?? false;
}
