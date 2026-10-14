/**
 * Rôles Skools centralisés (matrice docs/access-matrix.md).
 * Règle : aucun littéral "TEACHER"/"DIRECTOR"… en dehors de ce fichier —
 * comparer contre ROLES.* (résistant aux renommages, vérifié par TS).
 * Libellés FR : ROLE_LABELS_FR dans lib/permissions.ts.
 */
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  DIRECTOR: "DIRECTOR",
  ADMIN: "ADMIN",
  CENSEUR: "CENSEUR",
  BIBLIOTECAIRE: "BIBLIOTECAIRE",
  SURVEILLANT: "SURVEILLANT",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

/** Tous les rôles rattachables à un établissement (tous sauf SUPER_ADMIN). */
export const ESTABLISHMENT_ROLES: readonly string[] = [
  ROLES.DIRECTOR,
  ROLES.ADMIN,
  ROLES.CENSEUR,
  ROLES.BIBLIOTECAIRE,
  ROLES.SURVEILLANT,
  ROLES.TEACHER,
  ROLES.STUDENT,
  ROLES.PARENT,
];

/** Écriture académique/personnes : direction + administration (matrice). */
export function canManageSchool(role: string | null | undefined): boolean {
  return role === ROLES.DIRECTOR || role === ROLES.ADMIN;
}
