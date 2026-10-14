import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { ROUTES } from "../../lib/routes";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api, { requestServerLogout } from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import { roleLabel } from "../../lib/permissions";
import { PageHeader } from "../../layouts/PageHeader";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { ErrorState } from "../../components/ui/empty-state";

interface MeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
  establishments: Array<{
    role: string;
    establishment: { id: string; name: string; slug: string };
  }>;
}

interface MyChild {
  id: string;
  relation: "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER";
  isPrimary: boolean;
  student: { id: string; firstName: string; lastName: string; matricule: string | null };
}

const RELATION_LABELS: Record<MyChild["relation"], string> = {
  FATHER: "Père",
  MOTHER: "Mère",
  GUARDIAN: "Tuteur",
  OTHER: "Autre",
};

function memberSince(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
}

export default function ProfilPage() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const establishmentId = useAuthStore((s) => s.establishmentId);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const logout = useAuthStore((s) => s.logout);

  const meQuery = useQuery({
    queryKey: KEYS.me,
    queryFn: async () => (await api.get<MeResponse>(API.authMe)).data,
  });
  const childrenQuery = useQuery({
    queryKey: KEYS.myChildren,
    queryFn: async () => (await api.get<MyChild[]>(API.myChildren)).data,
    enabled: role === "PARENT",
  });

  const handleLogout = async () => {
    await requestServerLogout(refreshToken ?? undefined);
    logout();
    navigate(ROUTES.login);
  };

  const me = meQuery.data ?? null;
  const establishment = me?.establishments.find((e) => e.establishment.id === establishmentId);

  return (
    <div>
      <PageHeader title="Mon profil" description="Vos informations de compte." />

      {meQuery.isError ? (
        <ErrorState
          message="Impossible de charger le profil."
          onRetry={() => {
            void meQuery.refetch();
          }}
        />
      ) : meQuery.isPending || !me ? (
        <Skeleton className="h-[280px] rounded-r2" />
      ) : (
        <div className="flex flex-col gap-p6">
          <Card className="p-p6">
            <div className="flex items-center gap-p4">
              <Avatar alt={`${me.firstName} ${me.lastName}`} />
              <div>
                <h2 className="text-sb20 text-(--skools-text-primary)">
                  {me.firstName} {me.lastName}
                </h2>
                <p className="text-r14 text-(--skools-text-muted)">{me.email}</p>
              </div>
            </div>
            <div className="mt-p6 flex flex-wrap gap-x-p6 gap-y-p3">
              <div>
                <p className="text-r12 text-(--skools-text-muted)">Rôle</p>
                <Badge variant="neutral" className="mt-p1">{roleLabel(role)}</Badge>
              </div>
              <div>
                <p className="text-r12 text-(--skools-text-muted)">Établissement</p>
                <p className="mt-p1 text-m14 text-(--skools-text-primary)">
                  {establishment?.establishment.name ?? "Aucun"}
                </p>
              </div>
              <div>
                <p className="text-r12 text-(--skools-text-muted)">Téléphone</p>
                <p className="mt-p1 text-m14 text-(--skools-text-primary)">{me.phone || "—"}</p>
              </div>
              <div>
                <p className="text-r12 text-(--skools-text-muted)">Membre depuis</p>
                <p className="mt-p1 text-m14 text-(--skools-text-primary)">{memberSince(me.createdAt)}</p>
              </div>
            </div>
          </Card>

          {role === "PARENT" && (
            <Card className="p-p6">
              <h2 className="text-sb16 text-(--skools-text-primary)">Mes enfants</h2>
              <div className="mt-p4 flex flex-col gap-p3">
                {childrenQuery.isPending ? (
                  <Skeleton className="h-[48px] rounded-r2" count={2} />
                ) : (childrenQuery.data ?? []).length === 0 ? (
                  <p className="text-r14 text-(--skools-text-muted)">
                    Aucun enfant lié à ce compte pour le moment.
                  </p>
                ) : (
                  (childrenQuery.data ?? []).map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between gap-p3 rounded-r2 border border-(--skools-border-subtle) px-p4 py-p3"
                    >
                      <div>
                        <p className="text-m14 text-(--skools-text-primary)">
                          {child.student.firstName} {child.student.lastName}
                        </p>
                        <p className="text-r12 text-(--skools-text-muted)">
                          {RELATION_LABELS[child.relation]}
                          {child.student.matricule ? ` · ${child.student.matricule}` : ""}
                        </p>
                      </div>
                      {child.isPrimary && <Badge variant="success">Principal</Badge>}
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          <div>
            <Button fullWidth={false} variant="secondary" onClick={handleLogout}>
              Déconnexion
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
