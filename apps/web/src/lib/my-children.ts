import { useQuery } from "@tanstack/react-query";
import api from "./api";
import { useAuthStore } from "../stores/auth-store";
import { useSelectedChildStore } from "../stores/selected-child-store";

export interface ChildOption {
  student: { id: string; firstName: string; lastName: string; matricule: string | null };
  classroom: { id: string; name: string } | null;
}

/** Charge les enfants du parent connecté (rôle PARENT). */
export function useMyChildren(enabled = true) {
  return useQuery({
    queryKey: ["my-children"],
    queryFn: async () =>
      (
        await api.get<Array<ChildOption & { id: string }>>(
          "/parent-students/my-children",
        )
      ).data,
    enabled,
  });
}

/** Enfant effectif : sélection persistée, sinon premier enfant, sinon "". */
export function useEffectiveChildId(enabled = true): string {
  const establishmentId = useAuthStore((s) => s.establishmentId);
  const storedEstablishmentId = useSelectedChildStore((s) => s.establishmentId);
  const selectedChildId = useSelectedChildStore((s) => s.selectedChildId);
  const childrenQuery = useMyChildren(enabled);
  const children = childrenQuery.data ?? [];
  if (storedEstablishmentId === establishmentId && selectedChildId) return selectedChildId;
  return children[0]?.student.id ?? "";
}
