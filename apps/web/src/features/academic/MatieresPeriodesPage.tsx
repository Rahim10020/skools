import { PageHeader } from "../../layouts/PageHeader";
import { HubTabs } from "../../components/HubTabs";
import { useAuthStore } from "../../stores/auth-store";
import { canAccess } from "../../lib/permissions";
import { ROUTES } from "../../lib/routes";
import SubjectsPage from "../academic/SubjectsPage";
import PeriodsPage from "../academic/PeriodsPage";
import { EmptyState } from "../../components/ui/empty-state";

/**
 * Hub « Matières & périodes » (sidebar Année Scolaire).
 * Les routes unitaires restent valides en direct.
 */
export default function MatieresPeriodesPage() {
  const role = useAuthStore((state) => state.role);

  const tabs = [
    { label: "Matières", to: ROUTES.subjects, content: <SubjectsPage /> },
    { label: "Périodes", to: ROUTES.periods, content: <PeriodsPage /> },
  ].filter((tab) => canAccess(tab.to, role));

  return (
    <div>
      <PageHeader
        title="Matières & périodes"
        description="Matières enseignées et périodes d'évaluation de l'établissement."
      />
      {tabs.length === 0 ? (
        <EmptyState
          title="Accès non autorisé"
          description="Votre rôle ne donne accès à aucune de ces pages."
        />
      ) : (
        <HubTabs
          storageKey="matieres-periodes"
          tabs={tabs.map(({ label, content }) => ({ label, content }))}
        />
      )}
    </div>
  );
}
