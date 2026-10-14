import { ROUTES } from "../../lib/routes";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../lib/api";
import { useSelectedChildStore } from "../../stores/selected-child-store";
import { useAuthStore } from "../../stores/auth-store";
import { useMyChildren } from "../../lib/my-children";
import { PageHeader } from "../../layouts/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardTitle } from "../../components/ui/card";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowForwardIcon } from "../../components/icons/ArrowForwardIcon";

/**
 * « Mes enfants » (PARENT) : liste dynamique des enfants liés,
 * avec raccourcis vers leurs pages filtrées (sélection persistée).
 */
export default function MyChildrenPage() {
  const navigate = useNavigate();
  const establishmentId = useAuthStore((s) => s.establishmentId);
  const setSelectedChild = useSelectedChildStore((s) => s.setSelectedChild);
  const childrenQuery = useMyChildren();

  const children = childrenQuery.data ?? [];

  const goTo = (childId: string, to: string) => {
    setSelectedChild(establishmentId, childId);
    navigate(to);
  };

  return (
    <div>
      <PageHeader
        title="Mes enfants"
        description={
          children.length > 0
            ? `${children.length} enfant(s) lié(s) à votre compte.`
            : "Les enfants liés à votre compte."
        }
      />

      {childrenQuery.isError ? (
        <ErrorState
          title="Impossible de charger vos enfants"
          message={getErrorMessage(childrenQuery.error)}
          onRetry={() => {
            void childrenQuery.refetch();
          }}
        />
      ) : childrenQuery.isPending ? (
        <div className="grid grid-cols-1 gap-p4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="p-p4">
              <Skeleton className="h-[14px] w-1/2 rounded-r1" />
              <Skeleton className="mt-p3 h-[32px] w-1/3 rounded-r1" />
            </Card>
          ))}
        </div>
      ) : children.length === 0 ? (
        <EmptyState
          title="Aucun enfant lié"
          description="Aucun enfant n'est lié à votre compte. Contactez la direction de l'établissement."
        />
      ) : (
        <div className="grid grid-cols-1 gap-p4 sm:grid-cols-2">
          {children.map(({ student, classroom }) => (
            <Card key={student.id} className="p-p4">
              <CardTitle>
                {student.lastName} {student.firstName}
              </CardTitle>
              <p className="mt-p1 text-r12 text-(--skools-text-muted)">
                Matricule : {student.matricule || "—"} · Classe : {classroom?.name || "—"}
              </p>
              <div className="mt-p3 flex flex-wrap gap-p2">
                <Button fullWidth={false} variant="secondary" onClick={() => goTo(student.id, ROUTES.reportCards)}>
                  <span className="inline-flex items-center gap-p1">
                    Notes & bulletin <ArrowForwardIcon className="size-4" />
                  </span>
                </Button>
                <Button fullWidth={false} variant="secondary" onClick={() => goTo(student.id, ROUTES.myAbsences)}>
                  <span className="inline-flex items-center gap-p1">
                    Absences <ArrowForwardIcon className="size-4" />
                  </span>
                </Button>
                <Button fullWidth={false} variant="secondary" onClick={() => goTo(student.id, ROUTES.discipline)}>
                  <span className="inline-flex items-center gap-p1">
                    Discipline <ArrowForwardIcon className="size-4" />
                  </span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-p6 text-center text-r14 text-(--skools-text-muted)">
        <Link to={ROUTES.schedules} className="font-medium text-(--common-blue) hover:underline">
          Voir les emplois du temps
        </Link>
      </p>
    </div>
  );
}
