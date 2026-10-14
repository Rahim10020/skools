import { useAuthStore } from "../stores/auth-store";
import { useSelectedChildStore } from "../stores/selected-child-store";
import { useMyChildren } from "../lib/my-children";
import { Select } from "./ui/select";

/**
 * Sélecteur d'enfant (matrice : header PARENT + navigation filtrée).
 * Affiché dans la sidebar et en tête des pages parent.
 */
export function ChildSelector({ label = "Enfant" }: { label?: string }) {
  const establishmentId = useAuthStore((s) => s.establishmentId);
  const storedEstablishmentId = useSelectedChildStore((s) => s.establishmentId);
  const selectedChildId = useSelectedChildStore((s) => s.selectedChildId);
  const setSelectedChild = useSelectedChildStore((s) => s.setSelectedChild);
  const childrenQuery = useMyChildren();

  const children = childrenQuery.data ?? [];
  const effectiveChildId =
    storedEstablishmentId === establishmentId && selectedChildId
      ? selectedChildId
      : (children[0]?.student.id ?? "");

  if (childrenQuery.isPending || children.length <= 1) return null;

  return (
    <div className="px-p4 pb-p3">
      <span className="text-m12 text-(--skools-text-primary)">{label}</span>
      <div className="mt-p1">
        <Select
          label="Choisir…"
          value={effectiveChildId}
          onChange={(value) => setSelectedChild(establishmentId, value)}
          disableSearch={children.length <= 5}
          options={children.map(({ student, classroom }) => ({
            label: `${student.lastName} ${student.firstName}${classroom ? ` — ${classroom.name}` : ""}`,
            value: student.id,
          }))}
        />
      </div>
    </div>
  );
}
