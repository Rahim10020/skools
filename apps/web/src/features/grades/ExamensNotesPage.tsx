import { PageHeader } from "../../layouts/PageHeader";
import { HubTabs } from "../../components/HubTabs";
import { useAuthStore } from "../../stores/auth-store";
import { canAccess } from "../../lib/permissions";
import { ROUTES } from "../../lib/routes";
import ExamsPage from "../exams/ExamsPage";
import GradesPage from "./GradesPage";
import { EmptyState } from "../../components/ui/empty-state";

/**
 * Hub « Examens & notes » (sidebar Pédagogie) : évaluations et saisie
 * en onglets, filtrés par rôle (ex. enseignant : saisie uniquement).
 * Les routes unitaires restent valides en direct.
 */
export default function ExamensNotesPage() {
  const role = useAuthStore((state) => state.role);

  const tabs = [
    { label: "Examens", to: ROUTES.exams, content: <ExamsPage /> },
    { label: "Saisie de notes", to: ROUTES.grades, content: <GradesPage /> },
  ].filter((tab) => canAccess(tab.to, role));

  return (
    <div>
      <PageHeader
        title="Examens & notes"
        description="Évaluations créées et saisie des notes par examen."
      />
      {tabs.length === 0 ? (
        <EmptyState
          title="Accès non autorisé"
          description="Votre rôle ne donne accès à aucune de ces pages."
        />
      ) : (
        <HubTabs
          storageKey="examens-notes"
          tabs={tabs.map(({ label, content }) => ({ label, content }))}
        />
      )}
    </div>
  );
}
