/** Types d'établissement (miroir d'EstablishmentType côté API). */
export type EstablishmentType = "PRIMARY" | "COLLEGE" | "LYCEE" | "MIXED";

export const ESTABLISHMENT_TYPE_LABELS: Record<EstablishmentType, string> = {
  PRIMARY: "Primaire",
  COLLEGE: "Collège",
  LYCEE: "Lycée",
  MIXED: "Mixte",
};

/** Options de select dérivées des labels (source unique). */
export const ESTABLISHMENT_TYPE_OPTIONS: Array<{
  label: string;
  value: EstablishmentType;
}> = (
  Object.entries(ESTABLISHMENT_TYPE_LABELS) as Array<
    [EstablishmentType, string]
  >
).map(([value, label]) => ({ label, value }));
