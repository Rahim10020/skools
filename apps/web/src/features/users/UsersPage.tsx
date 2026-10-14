import { ROLES } from "../../lib/roles";
import { API, apiPath } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { useState, type FormEvent } from "react";
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
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "../../components/ui/toast";
import PlusIcon from "../../components/icons/PlusIcon";

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

  const items = members.data ?? [];

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
        <TableContainer>
          <Table aria-label="Chargement des membres">
            <TableBody>
              {[0, 1, 2].map((row) => (
                <TableRow key={row}>
                  <TableCell>
                    <Skeleton className="h-[16px] w-3/4 rounded-r1" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-[16px] w-1/2 rounded-r1" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-[16px] w-16 rounded-r1" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun membre pour le moment"
          description="Ajoutez le premier membre avec le bouton « Ajouter un membre »."
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Membre</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Rôle</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">Actions</span>
                </TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {items.map((member) => {
                const isSelf = member.user.id === currentUserId;
                return (
                  <TableRow key={member.id}>
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
                      <div className="flex justify-end gap-p3">
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
                              className="text-r12 font-medium text-(--common-blue) hover:underline"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              aria-label={`Retirer ${memberName(member)}`}
                              onClick={() => setDeleteTarget(member)}
                              className="text-r12 font-medium text-(--common-red) hover:underline"
                            >
                              Retirer
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
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
    </div>
  );
}
