import type { SelectOption } from "../../components/ui/select";
import { RELATION_LABELS, type ParentRelation } from "../../lib/status-meta";

export type { ParentRelation };
export { RELATION_LABELS };

/** Options de select dérivées des labels (source unique). */
export const RELATION_OPTIONS: SelectOption[] = (
  Object.entries(RELATION_LABELS) as Array<[ParentRelation, string]>
).map(([value, label]) => ({ label, value }));
