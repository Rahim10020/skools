import { ROLES } from "../../lib/roles";
import { ROLE_LABELS_FR } from "../../lib/permissions";

/** Rôles attribuables par un DIRECTOR (matrice : tout sauf SUPER_ADMIN). */
export const ASSIGNABLE_ROLES = Object.keys(ROLE_LABELS_FR)
  .filter((role) => role !== ROLES.SUPER_ADMIN)
  .map((role) => ({ label: ROLE_LABELS_FR[role], value: role }));
