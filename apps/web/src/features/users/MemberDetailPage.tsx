import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { API } from "../../lib/api-endpoints";
import { roleLabel } from "../../lib/permissions";
import { useAuthStore } from "../../stores/auth-store";
import { Button } from "../../components/ui/button";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { ListHeader } from "../../components/data-list/ListHeader";
import { ListSkeleton } from "../../components/data-list/ListSkeleton";
import { StatusPill } from "../../components/data-list/StatusPill";
import {
  DetailContainer,
  DetailFields,
  StickyBar,
} from "../../components/detail/DetailSection";
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
  // Le total sert au compteur du header (langage liste).
  const members = useQuery({
    queryKey: ["member", id],
    queryFn: async () =>
      (await api.get<Member[]>(API.userEstablishments)).data,
    enabled: !!id,
    select: (rows) => ({
      member: rows.find((row) => row.id === id) ?? null,
      total: rows.length,
    }),
  });

  const total = members.data?.total ?? 0;

  if (members.isPending) {
    return (
      <div>
        <StickyBar>
          <ListHeader
            title="Utilisateurs & rôles"
            count={0}
            countLabel="membres"
          />
        </StickyBar>
        <ListSkeleton label="Chargement du membre" />
      </div>
    );
  }

  if (members.isError) {
    return (
      <div>
        <StickyBar>
          <ListHeader
            title="Utilisateurs & rôles"
            count={0}
            countLabel="membres"
          />
        </StickyBar>
        <ErrorState
          title="Impossible de charger ce membre"
          message={getErrorMessage(members.error)}
          onRetry={() => void members.refetch()}
        />
      </div>
    );
  }

  if (!members.data.member) {
    return (
      <div>
        <StickyBar>
          <ListHeader
            title="Utilisateurs & rôles"
            count={total}
            countLabel="membres"
          />
        </StickyBar>
        <EmptyState
          title="Membre introuvable"
          description="Ce membre n'appartient plus à l'établissement ou le lien est invalide."
        />
      </div>
    );
  }

  const member = members.data.member;
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

  const editButton = isSelf ? undefined : (
    <Button
      variant="tag"
      fullWidth={false}
      title="Modifier le rôle"
      onClick={() => setEditOpen(true)}
    >
      Modifier le rôle
    </Button>
  );

  return (
    <div>
      <StickyBar>
        <ListHeader
          title="Utilisateurs & rôles"
          count={total}
          countLabel="membres"
          extra={editButton}
        />
      </StickyBar>
      <DetailContainer>
        <h2 className="font-semibold text-sb24 leading-9 text-(--skools-text-primary)">
          {memberName}
        </h2>
        <DetailFields fields={fields} />
      </DetailContainer>

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
