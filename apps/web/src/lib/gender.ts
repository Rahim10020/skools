/** Options de genre (libellés complets, stockés tels quels). */
export const GENDER_OPTIONS = [
  { label: "Féminin", value: "Féminin" },
  { label: "Masculin", value: "Masculin" },
];

/**
 * Libellé de genre tolérent : accepte les libellés complets et les anciens
 * codes M/F (filet de sécurité pour les données seed).
 */
export function genderLabel(gender: string | null | undefined): string {
  if (!gender) return "—";
  if (gender === "M") return "Masculin";
  if (gender === "F") return "Féminin";
  return gender;
}
