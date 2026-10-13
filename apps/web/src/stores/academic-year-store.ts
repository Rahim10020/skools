import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AcademicYearState {
  /** Établissement pour lequel l'année a été choisie (sécurité multi-comptes). */
  establishmentId: string | null;
  activeYearId: string | null;
  setActiveYear: (establishmentId: string | null, activeYearId: string) => void;
  clearActiveYear: () => void;
}

/**
 * Année scolaire active (sélecteur matrice, règle header 2/6).
 * Phase 6 : niveau affichage/persistance. Le filtrage des listes par
 * année active est Phase 7 (les pages filtrent déjà par sélecteurs locaux).
 */
export const useAcademicYearStore = create<AcademicYearState>()(
  persist(
    (set) => ({
      establishmentId: null,
      activeYearId: null,

      setActiveYear: (establishmentId, activeYearId) =>
        set({ establishmentId, activeYearId }),

      clearActiveYear: () => set({ establishmentId: null, activeYearId: null }),
    }),
    { name: "skools-academic-year" },
  ),
);
