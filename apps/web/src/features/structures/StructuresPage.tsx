import { PageHeader } from "../../layouts/PageHeader";
import { HubTabs } from "../../components/HubTabs";
import { useAuthStore } from "../../stores/auth-store";
import { canAccess } from "../../lib/permissions";
import { ROUTES } from "../../lib/routes";
import AcademicYearsPage from "../academic/AcademicYearsPage";
import CyclesPage from "../academic/CyclesPage";
import LevelsPage from "../academic/LevelsPage";
import SeriesPage from "../academic/SeriesPage";
import ClassroomsPage from "../academic/ClassroomsPage";
import { EmptyState } from "../../components/ui/empty-state";

/**
 * Hub « Structures » (sidebar Année Scolaire) : toute la structure
 * académique en onglets. Les routes unitaires restent valides en direct.
 */
export default function StructuresPage() {
  const role = useAuthStore((state) => state.role);

  const tabs = [
    { label: "Années scolaires", to: ROUTES.academicYears, content: <AcademicYearsPage /> },
    { label: "Cycles", to: ROUTES.cycles, content: <CyclesPage /> },
    { label: "Niveaux", to: ROUTES.levels, content: <LevelsPage /> },
    { label: "Séries", to: ROUTES.series, content: <SeriesPage /> },
    { label: "Classes", to: ROUTES.classrooms, content: <ClassroomsPage /> },
  ].filter((tab) => canAccess(tab.to, role));

  return (
    <div>
      <PageHeader
        title="Structures"
        description="Années scolaires, cycles, niveaux, séries et classes de l'établissement."
      />
      {tabs.length === 0 ? (
        <EmptyState
          title="Accès non autorisé"
          description="Votre rôle ne donne accès à aucune de ces pages."
        />
      ) : (
        <HubTabs
          storageKey="structures"
          tabs={tabs.map(({ label, content }) => ({ label, content }))}
        />
      )}
    </div>
  );
}
