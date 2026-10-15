import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { API } from "../../lib/api-endpoints";
import { ROUTES } from "../../lib/routes";
import { roleLabel } from "../../lib/permissions";
import { PageHeader } from "../../layouts/PageHeader";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { ListSkeleton } from "../../components/data-list/ListSkeleton";
import { StatusPill } from "../../components/data-list/StatusPill";

interface Member {
  id: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  user: { id: string; email: string; firstName: string; lastName: string };
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Pas de `GET /:id` côté API : on lit la liste (tableau brut) et on sélectionne.
  const members = useQuery({
    queryKey: ["member", id],
    queryFn: async () =>
      (await api.get<Member[]>(API.userEstablishments)).data,
    enabled: !!id,
    select: (rows) => rows.find((row) => row.id === id) ?? null,
  });

  if (members.isPending) {
    return (
      <div>
        <PageHeader title="Membre" backTo={ROUTES.users} backLabel="Utilisateurs" />
        <ListSkeleton label="Chargement du membre" />
      </div>
    );
  }

  if (members.isError) {
    return (
      <div>
        <PageHeader title="Membre" backTo={ROUTES.users} backLabel="Utilisateurs" />
        <ErrorState
          title="Impossible de charger ce membre"
          message={getErrorMessage(members.error)}
          onRetry={() => void members.refetch()}
        />
      </div>
    );
  }

  if (!members.data) {
    return (
      <div>
        <PageHeader title="Membre" backTo={ROUTES.users} backLabel="Utilisateurs" />
        <EmptyState
          title="Membre introuvable"
          description="Ce membre n'appartient plus à l'établissement ou le lien est invalide."
        />
      </div>
    );
  }

  const member = members.data;
  const fields: Array<[string, React.ReactNode]> = [
    ["Email", member.user.email],
    [
      "Rôle",
      <StatusPill key="role" label={roleLabel(member.role)} variant="neutral" />,
    ],
    [
      "Statut",
      member.isActive ? (
        <StatusPill key="status" label="Actif" variant="success" />
      ) : (
        <StatusPill key="status" label="Inactif" variant="neutral" />
      ),
    ],
    ["Membre depuis", formatDateTime(member.createdAt)],
  ];

  return (
    <div>
      <PageHeader
        title={`${member.user.lastName} ${member.user.firstName}`}
        description={member.user.email}
        backTo={ROUTES.users}
        backLabel="Utilisateurs"
      />
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-p6 pb-p10">
        {fields.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-p3 py-p3 border-t-[0.4px] border-(--skools-border-subtle)"
          >
            <dt className="text-r12 text-(--skools-text-muted)">{label}</dt>
            <dd className="text-r14 text-(--skools-text-primary) text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
