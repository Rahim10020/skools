import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { API } from "../../lib/api-endpoints";
import { ROUTES } from "../../lib/routes";
import { roleLabel } from "../../lib/permissions";
import { useAuthStore } from "../../stores/auth-store";
import { PageHeader } from "../../layouts/PageHeader";
import { Button } from "../../components/ui/button";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { ListSkeleton } from "../../components/data-list/ListSkeleton";
import { StatusPill } from "../../components/data-list/StatusPill";
import { DetailFields } from "../../components/detail/DetailSection";
import { EditMemberRoleModal } from "./EditMemberRoleModal";

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
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [editOpen, setEditOpen] = useState(false);

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

  const memberName = `${member.user.lastName} ${member.user.firstName}`;
  const isSelf = member.user.id === currentUserId;

  return (
    <div>
      <PageHeader
        title={memberName}
        description={member.user.email}
        backTo={ROUTES.users}
        backLabel="Utilisateurs"
        actions={
          isSelf ? undefined : (
            <Button fullWidth={false} onClick={() => setEditOpen(true)}>
              Modifier le rôle
            </Button>
          )
        }
      />
      <div className="pb-p10">
        <DetailFields fields={fields} />
      </div>

      {editOpen && !isSelf && (
        <EditMemberRoleModal
          key={member.id}
          member={{ id: member.id, name: memberName, role: member.role }}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
