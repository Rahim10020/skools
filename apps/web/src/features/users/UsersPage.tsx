import { API, apiPath } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { ROUTES } from "../../lib/routes";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { unwrapList, type PaginatedList } from "../../hooks/use-crud";
import api, { getErrorMessage } from "../../lib/api";
import { roleLabel } from "../../lib/permissions";
import { ASSIGNABLE_ROLES } from "./member-roles";
import { EditMemberRoleModal } from "./EditMemberRoleModal";
import { useAuthStore } from "../../stores/auth-store";
import { Button } from "../../components/ui/button";
import { FormDialog, type CrudFieldDef } from "../../components/crud/CrudPage";
import { Modal } from "../../components/ui/use-modal";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { toast } from "../../components/ui/toast";
import PlusIcon from "../../components/icons/PlusIcon";
import { useRowSelection } from "../../components/data-list/use-row-selection";
import { exportToCsv } from "../../components/data-list/csv";
import { Pagination } from "../../components/data-list/Pagination";
import { HeaderSelect } from "../../components/data-list/HeaderSelect";
import { ListHeader } from "../../components/data-list/ListHeader";
import { DataList } from "../../components/data-list/DataList";
import { ListSkeleton } from "../../components/data-list/ListSkeleton";

const USERS_PAGE_SIZE = 10;

interface Member {
  id: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  user: { id: string; email: string; firstName: string; lastName: string };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const addMemberSchema = z.object({
  email: z.string().regex(EMAIL_RE, "Email invalide"),
  role: z.string().min(1, "Choisissez un rôle"),
});

const addMemberFields: CrudFieldDef[] = [
  {
    name: "email",
    label: "Email",
    type: "text",
    required: true,
    placeholder: "adresse@exemple.com",
  },
  {
    name: "role",
    label: "Rôle",
    type: "select",
    required: true,
    placeholder: "Choisir un rôle",
    options: ASSIGNABLE_ROLES,
    disableSelectSearch: true,
  },
];

const memberName = (member: Member) =>
  `${member.user.lastName} ${member.user.firstName}`;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkPending, setBulkPending] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const selection = useRowSelection();

  const memberParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(USERS_PAGE_SIZE));
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    return params.toString();
  }, [page, search, roleFilter]);

  const members = useQuery({
    queryKey: [...KEYS.members, memberParams],
    queryFn: async () => {
      const raw = (
        await api.get<Member[] | PaginatedList<Member>>(
          `${API.userEstablishments}?${memberParams}`,
        )
      ).data;
      const { items, pagination } = unwrapList(raw);
      return {
        items,
        total: pagination?.total_count ?? items.length,
        totalPages: Math.max(pagination?.total_pages ?? 1, 1),
        serverPage: pagination?.page ?? 1,
      };
    },
  });

  const handleMemberSearch = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
      selection.clear();
    },
    [selection],
  );

  const handleRoleFilter = useCallback(
    (value: string) => {
      setRoleFilter(value);
      setPage(1);
      selection.clear();
    },
    [selection],
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: KEYS.members });

  const addMutation = useMutation({
    mutationFn: async (payload: { email: string; role: string }) =>
      (await api.post(API.userEstablishments, payload)).data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      (await api.delete(apiPath.withId(API.userEstablishments, id))).data,
  });

  const handleAdd = async (values: Record<string, string>) => {
    await addMutation.mutateAsync({
      email: values.email.trim(),
      role: values.role,
    });
    invalidate();
    toast.success("Membre ajouté avec succès");
    setAddOpen(false);
  };

  const openEdit = (member: Member) => {
    setEditing(member);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      invalidate();
      toast.success("Accès retiré avec succès");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const items = useMemo(() => members.data?.items ?? [], [members.data]);
  const total = members.data?.total ?? 0;
  const totalPages = members.data?.totalPages ?? 1;
  const serverPage = members.data?.serverPage ?? page;
  const pageIds = useMemo(() => items.map((m) => m.id), [items]);
  const pageSelectedCount = pageIds.filter((id) => selection.has(id)).length;
  const pageAllChecked =
    pageIds.length > 0 && pageSelectedCount === pageIds.length;
  const pageIndeterminate = pageSelectedCount > 0 && !pageAllChecked;
  // Sécurité : on ne retire jamais son propre accès en masse.
  const bulkIds = selection.selectedIds.filter((id) => {
    const member = items.find((m) => m.id === id);
    return member && member.user.id !== currentUserId;
  });

  const invertPageSelection = () => {
    const selectedOnPage = new Set(pageIds.filter((id) => selection.has(id)));
    selection.selectMany(
      pageIds.filter((id) => !selectedOnPage.has(id)),
      true,
    );
    selection.selectMany([...selectedOnPage], false);
  };

  const handleBulkRemove = async () => {
    if (bulkIds.length === 0) return;
    setBulkPending(true);
    const results = await Promise.allSettled(
      bulkIds.map((id) => deleteMutation.mutateAsync(id)),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const ko = results.length - ok;
    invalidate();
    selection.clear();
    setBulkConfirmOpen(false);
    setBulkPending(false);
    if (ko === 0) toast.success(`${ok} accès retiré(s)`);
    else if (ok === 0) toast.error("Retrait groupé impossible");
    else toast.error(`${ok} retiré(s), ${ko} échec(s)`);
  };

  const handleExport = () => {
    const byId = new Map(items.map((m) => [m.id, m]));
    const rows = selection.selectedIds
      .map((id) => byId.get(id))
      .filter((m): m is Member => !!m)
      .map((m) => [memberName(m), m.user.email, roleLabel(m.role)]);
    exportToCsv("utilisateurs", ["Membre", "Email", "Rôle"], rows);
  };

  const selectAll = (
    <HeaderSelect
      checked={pageAllChecked}
      indeterminate={pageIndeterminate}
      onToggleAll={() => selection.selectMany(pageIds, !pageAllChecked)}
      onSelectAll={() => selection.selectMany(pageIds, true)}
      onSelectNone={() => selection.selectMany(pageIds, false)}
      onInvert={invertPageSelection}
    />
  );
  const createButton = (
    <Button
      variant="tag"
      fullWidth={false}
      icon={<PlusIcon className="size-full" />}
      iconPosition="left"
      title="Ajouter un membre"
      onClick={() => setAddOpen(true)}
    >
      Ajouter un membre
    </Button>
  );

  return (
    <div>
      <ListHeader
        title="Utilisateurs & rôles"
        description="Les comptes membres de l'établissement et leurs rôles. L'utilisateur doit déjà avoir un compte Skools."
        count={members.isPending ? 0 : total}
        countLabel="membres"
        filters={[
          {
            key: "role",
            label: "Rôle",
            value: roleFilter,
            options: ASSIGNABLE_ROLES,
            onChange: handleRoleFilter,
          },
        ]}
        searchable
        searchPlaceholder="Rechercher un membre…"
        onSearch={handleMemberSearch}
        selection={{
          count: selection.selectedCount,
          canDelete: true,
          canExport: true,
          pending: bulkPending,
          onDelete: () => setBulkConfirmOpen(true),
          onExport: handleExport,
          onClear: selection.clear,
        }}
        selectAll={selectAll}
        createButton={createButton}
      />

      {members.isError ? (
        <ErrorState
          title="Impossible de charger les membres"
          message={getErrorMessage(members.error)}
          onRetry={() => void members.refetch()}
        />
      ) : members.isPending ? (
        <ListSkeleton label="Chargement des membres" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun membre pour le moment"
          description="Ajoutez le premier membre avec le bouton « Ajouter un membre »."
        />
      ) : (
        <div className="w-full flex flex-col gap-p4 pb-p10 mt-p10">
          <DataList
            items={items}
            columns={[
              {
                header: "Membre",
                primary: true,
                render: (member) => (
                  <>
                    {memberName(member)}
                    {member.user.id === currentUserId && (
                      <span className="ml-p2 text-r11 text-(--skools-text-muted)">
                        (vous)
                      </span>
                    )}
                  </>
                ),
              },
              { header: "Email", render: (member) => member.user.email },
            ]}
            idOf={(member) => member.id}
            nameOf={memberName}
            statusPill={(member) => ({
              label: roleLabel(member.role),
              variant: "neutral" as const,
            })}
            selection={{
              has: selection.has,
              toggle: selection.toggle,
            }}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            hideActionsFor={(member) => member.user.id === currentUserId}
            rowTo={(member) => `${ROUTES.users}/${member.id}`}
          />
          {totalPages > 1 && (
            <div className="ml-auto">
              <Pagination
                page={serverPage}
                totalPages={totalPages}
                onPageChange={(next) => {
                  setPage(next);
                  selection.clear();
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Ajout */}
      <FormDialog
        open={addOpen}
        onOpenChange={(open) => !open && setAddOpen(false)}
        title="Ajouter un membre"
        description="Le compte doit exister et ne pas appartenir à un autre établissement."
        submitLabel="Ajouter"
        fields={addMemberFields}
        schema={addMemberSchema}
        defaults={{ email: "", role: "" }}
        pending={addMutation.isPending}
        onSubmit={handleAdd}
      />

      {/* Changement de rôle (modal partagé avec la page détail) */}
      {editing && (
        <EditMemberRoleModal
          key={editing.id}
          member={{
            id: editing.id,
            name: memberName(editing),
            role: editing.role,
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Retrait */}
      <Modal.Root
        size="sm"
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        {deleteTarget && (
          <Modal.Content labelledBy="users-delete-title">
            <Modal.Header>
              <Modal.Title id="users-delete-title">
                Confirmer le retrait
              </Modal.Title>
              <Modal.Description>
                Retirer l'accès de « {memberName(deleteTarget)} » à
                l'établissement ? Le compte reste actif mais sans établissement.
              </Modal.Description>
            </Modal.Header>
            <Modal.Footer>
              <Modal.Close>
                <Button variant="secondary" fullWidth={false}>
                  Annuler
                </Button>
              </Modal.Close>
              <Button
                fullWidth={false}
                variant={deleteMutation.isPending ? "loading" : "primary"}
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
                className="bg-(--common-red)!"
              >
                Retirer
              </Button>
            </Modal.Footer>
          </Modal.Content>
        )}
      </Modal.Root>

      {/* Retrait groupé (hors soi-même) */}
      <Modal.Root
        size="sm"
        open={bulkConfirmOpen}
        onOpenChange={(open) => !open && setBulkConfirmOpen(false)}
      >
        <Modal.Content labelledBy="users-bulk-title">
          <Modal.Header>
            <Modal.Title id="users-bulk-title">
              Retirer {bulkIds.length} accès ?
            </Modal.Title>
            <Modal.Description>
              Votre propre accès est exclu automatiquement. Cette action est
              irréversible.
            </Modal.Description>
          </Modal.Header>
          <Modal.Footer>
            <Modal.Close>
              <Button variant="secondary" fullWidth={false}>
                Annuler
              </Button>
            </Modal.Close>
            <Button
              fullWidth={false}
              variant={bulkPending ? "loading" : "primary"}
              disabled={bulkPending || bulkIds.length === 0}
              onClick={handleBulkRemove}
              className="bg-(--common-red)!"
            >
              Retirer
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </div>
  );
}
