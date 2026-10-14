import type { SelectOption } from "../../components/ui/select";

/** Lien parent ↔ élève (miroir de ParentRelation côté API). */
export type ParentRelation = "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER";

export const RELATION_LABELS: Record<ParentRelation, string> = {
  FATHER: "Père",
  MOTHER: "Mère",
  GUARDIAN: "Tuteur",
  OTHER: "Autre",
};

/** Options de select dérivées des labels (source unique). */
export const RELATION_OPTIONS: SelectOption[] = (
  Object.entries(RELATION_LABELS) as Array<[ParentRelation, string]>
).map(([value, label]) => ({ label, value }));
