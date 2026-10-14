import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SelectedChildState {
  /** Établissement courant (sécurité multi-comptes, comme l'année active). */
  establishmentId: string | null;
  selectedChildId: string | null;
  setSelectedChild: (establishmentId: string | null, childId: string) => void;
  clearSelectedChild: () => void;
}

/**
 * Enfant sélectionné du parent (matrice : navigation PARENT filtrée par enfant).
 * Persisté par établissement ; les pages retombent sur le premier enfant sinon.
 */
export const useSelectedChildStore = create<SelectedChildState>()(
  persist(
    (set) => ({
      establishmentId: null,
      selectedChildId: null,

      setSelectedChild: (establishmentId, childId) =>
        set({ establishmentId, selectedChildId: childId }),

      clearSelectedChild: () => set({ establishmentId: null, selectedChildId: null }),
    }),
    { name: "skools-selected-child" },
  ),
);
