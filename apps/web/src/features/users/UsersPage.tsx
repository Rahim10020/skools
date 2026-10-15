import { ROLES } from "../../lib/roles";
import { API, apiPath } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { ROLE_LABELS_FR, roleLabel } from "../../lib/permissions";
import { useAuthStore } from "../../stores/auth-store";
import { PageHeader } from "../../layouts/PageHeader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableCellPrimary,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "../../components/ui/table";
import { Modal } from "../../components/ui/use-modal";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { toast } from "../../components/ui/toast";
import PlusIcon from "../../components/icons/PlusIcon";
import { Checkbox } from "../../components/ui/checkbox";
import { useRowSelection } from "../../components/data-list/use-row-selection";
import { exportToCsv } from "../../components/data-list/csv";
import { Pagination } from "../../components/data-list/Pagination";
import { HeaderSelect } from "../../components/data-list/HeaderSelect";
import { DataListToolbar } from "../../components/data-list/DataListToolbar";
import { DataListSkeleton } from "../../components/data-list/DataListSkeleton";

const USERS_PAGE_SIZE = 10;

interface Member {
  id: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  user: { id: string; email: string; firstName: string; lastName: string };
}

/** Rôles attribuables par un DIRECTOR (matrice : tout sauf SUPER_ADMIN). */
const ASSIGNABLE_ROLES = Object.keys(ROLE_LABELS_FR)
  .filter((role) => role !== ROLES.SUPER_ADMIN)
  .map((role) => ({ label: ROLE_LABELS_FR[role], value: role }));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const memberName = (member: Member) =>
  `${member.user.lastName} ${member.user.firstName}`;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkPending, setBulkPending] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const selection = useRowSelection();

  const members = useQuery({
    queryKey: KEYS.members,
    queryFn: async () => (await api.get<Member[]>(API.userEstablishments)).data,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: KEYS.members });

  const addMutation = useMutation({
    mutationFn: async () =>
      (await api.post(API.userEstablishments, { email: email.trim(), role }))
        .data,
  });

  const editMutation = useMutation({
    mutationFn: async () =>
      (
        await api.patch(apiPath.withId(API.userEstablishments, editing!.id), {
          role: editRole,
        })
      ).data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      (await api.delete(apiPath.withId(API.userEstablishments, id))).data,
  });

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setFormError("Email invalide");
      return;
    }
    if (!role) {
      setFormError("Choisissez un rôle");
      return;
    }
    setFormError(null);
    try {
      await addMutation.mutateAsync();
      invalidate();
      toast.success("Membre ajouté avec succès");
      setAddOpen(false);
      setEmail("");
      setRole("");
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setEditRole(member.role);
    setEditError(null);
  };

  const handleEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editRole) {
      setEditError("Choisissez un rôle");
      return;
    }
    setEditError(null);
    try {
      await editMutation.mutateAsync();
      invalidate();
      toast.success("Rôle modifié avec succès");
      setEditing(null);
    } catch (error) {
      setEditError(getErrorMessage(error));
    }
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

  const items = useMemo(() => members.data ?? [], [members.data]);
  const totalPages = Math.max(1, Math.ceil(items.length / USERS_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * USERS_PAGE_SIZE, safePage * USERS_PAGE_SIZE),
    [items, safePage],
  );
  const pageIds = useMemo(() => pageItems.map((m) => m.id), [pageItems]);
  const pageSelectedCount = pageIds.filter((id) => selection.has(id)).length;
  const pageAllChecked = pageIds.length > 0 && pageSelectedCount === pageIds.length;
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

  return (
    <div>
      <PageHeader
        title="Utilisateurs & rôles"
        description="Les comptes membres de l'établissement et leurs rôles. L'utilisateur doit déjà avoir un compte Skools."
        actions={
          <Button
            fullWidth={false}
            icon={<PlusIcon className="size-full" />}
            onClick={() => setAddOpen(true)}
          >
            Ajouter un membre
          </Button>
        }
      />

      {members.isError ? (
        <ErrorState
          title="Impossible de charger les membres"
          message={getErrorMessage(members.error)}
          onRetry={() => void members.refetch()}
        />
      ) : members.isPending ? (
        <DataListSkeleton columns={3} label="Chargement des membres" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun membre pour le moment"
          description="Ajoutez le premier membre avec le bouton « Ajouter un membre »."
        />
      ) : (
        <div className="flex flex-col gap-p3">
          <DataListToolbar
            total={items.length}
            itemLabel="membre"
            selectedCount={selection.selectedCount}
            canDelete
            canExport
            bulkPending={bulkPending}
            onBulkDelete={() => setBulkConfirmOpen(true)}
            onExport={handleExport}
            onClear={selection.clear}
          />
          <TableContainer>
            <Table>
              <TableHeader>
                <tr>
                  <TableHeaderCell className="w-10">
                    <HeaderSelect
                      checked={pageAllChecked}
                      indeterminate={pageIndeterminate}
                      onToggleAll={() =>
                        selection.selectMany(pageIds, !pageAllChecked)
                      }
                      onSelectAll={() => selection.selectMany(pageIds, true)}
                      onSelectNone={() => selection.selectMany(pageIds, false)}
                      onInvert={invertPageSelection}
                    />
                  </TableHeaderCell>
                  <TableHeaderCell>Membre</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Rôle</TableHeaderCell>
                  <TableHeaderCell>
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                </tr>
              </TableHeader>
              <TableBody>
                {pageItems.map((member) => {
                  const isSelf = member.user.id === currentUserId;
                  const checked = selection.has(member.id);
                  return (
                    <TableRow
                      key={member.id}
                      className={`group ${checked ? "bg-(--skools-interactive-active-bg)/40" : ""}`}
                    >
                      <TableCell className="w-10">
                        <Checkbox
                          checked={checked}
                          onChange={() => selection.toggle(member.id)}
                          aria-label={`Sélectionner ${memberName(member)}`}
                        />
                      </TableCell>
                      <TableCellPrimary>
                        {memberName(member)}
                        {isSelf && (
                          <span className="ml-p2 text-r11 text-(--skools-text-muted)">
                            (vous)
                          </span>
                        )}
                      </TableCellPrimary>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>{roleLabel(member.role)}</TableCell>
                      <TableCell>
                        <div className="hidden lg:flex justify-end gap-p3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          {isSelf ? (
                            <span className="text-r12 text-(--skools-text-muted)">
                              —
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                aria-label={`Modifier le rôle de ${memberName(member)}`}
                                onClick={() => openEdit(member)}
                                className="text-r12 font-medium text-(--common-blue) hover:underline cursor-pointer"
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                aria-label={`Retirer ${memberName(member)}`}
                                onClick={() => setDeleteTarget(member)}
                                className="text-r12 font-medium text-(--common-red) hover:underline cursor-pointer"
                              >
                                Retirer
                              </button>
                            </>
                          )}
                        </div>
                        <div className="relative flex justify-end lg:hidden">
                          <button
                            type="button"
                            aria-label={`Options pour ${memberName(member)}`}
                            aria-haspopup="menu"
                            aria-expanded={menuOpenId === member.id}
                            onClick={() =>
                              setMenuOpenId((v) =>
                                v === member.id ? null : member.id,
                              )
                            }
                            className="inline-flex size-8 items-center justify-center rounded-r1 text-r14 text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) cursor-pointer"
                          >
                            •••
                          </button>
                          {menuOpenId === member.id && !isSelf && (
                            <div
                              role="menu"
                              className="absolute right-0 top-full z-30 mt-1 min-w-36 flex flex-col gap-1 rounded-r2 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) p-1 shadow-lg"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  openEdit(member);
                                }}
                                className="block w-full rounded-r2 px-p2 py-1.5 text-left text-r12 text-(--common-blue) hover:bg-(--skools-interactive-hover-bg) cursor-pointer"
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setDeleteTarget(member);
                                }}
                                className="block w-full rounded-r2 px-p2 py-1.5 text-left text-r12 text-(--common-red) hover:bg-(--skools-interactive-hover-bg) cursor-pointer"
                              >
                                Retirer
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <div className="ml-auto">
              <Pagination
                page={safePage}
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
      <Modal.Root
        open={addOpen}
        onOpenChange={(open) => !open && setAddOpen(false)}
      >
        {addOpen && (
          <Modal.Content labelledBy="users-add-title">
            <Modal.Header>
              <Modal.Title id="users-add-title">Ajouter un membre</Modal.Title>
              <Modal.Description>
                Le compte doit exister et ne pas appartenir à un autre
                établissement.
              </Modal.Description>
            </Modal.Header>
            <Modal.Body>
              <form
                id="users-add-form"
                onSubmit={handleAdd}
                className="flex flex-col gap-p4"
                noValidate
              >
                <div className="flex flex-col gap-p1">
                  <span className="text-m12 text-(--skools-text-primary)">
                    Email <span className="text-(--common-red)"> *</span>
                  </span>
                  <Input
                    label="adresse@exemple.com"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                  />
                </div>
                <div className="flex flex-col gap-p1">
                  <span className="text-m12 text-(--skools-text-primary)">
                    Rôle <span className="text-(--common-red)"> *</span>
                  </span>
                  <Select
                    label="Choisir un rôle"
                    options={ASSIGNABLE_ROLES}
                    value={role}
                    onChange={setRole}
                    disableSearch
                  />
                </div>
                {formError && (
                  <p role="alert" className="text-r14 text-(--common-red)">
                    {formError}
                  </p>
                )}
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Modal.Close>
                <Button variant="secondary" fullWidth={false}>
                  Annuler
                </Button>
              </Modal.Close>
              <Button
                fullWidth={false}
                type="submit"
                form="users-add-form"
                variant={addMutation.isPending ? "loading" : "primary"}
                disabled={addMutation.isPending}
              >
                Ajouter
              </Button>
            </Modal.Footer>
          </Modal.Content>
        )}
      </Modal.Root>

      {/* Changement de rôle */}
      <Modal.Root
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        {editing && (
          <Modal.Content labelledBy="users-edit-title">
            <Modal.Header>
              <Modal.Title id="users-edit-title">
                Modifier le rôle de {memberName(editing)}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form
                id="users-edit-form"
                onSubmit={handleEdit}
                className="flex flex-col gap-p4"
                noValidate
              >
                <div className="flex flex-col gap-p1">
                  <span className="text-m12 text-(--skools-text-primary)">
                    Rôle
                  </span>
                  <Select
                    label="Choisir un rôle"
                    options={ASSIGNABLE_ROLES}
                    value={editRole}
                    onChange={setEditRole}
                    disableSearch
                  />
                </div>
                {editError && (
                  <p role="alert" className="text-r14 text-(--common-red)">
                    {editError}
                  </p>
                )}
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Modal.Close>
                <Button variant="secondary" fullWidth={false}>
                  Annuler
                </Button>
              </Modal.Close>
              <Button
                fullWidth={false}
                type="submit"
                form="users-edit-form"
                variant={editMutation.isPending ? "loading" : "primary"}
                disabled={editMutation.isPending}
              >
                Enregistrer
              </Button>
            </Modal.Footer>
          </Modal.Content>
        )}
      </Modal.Root>

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
