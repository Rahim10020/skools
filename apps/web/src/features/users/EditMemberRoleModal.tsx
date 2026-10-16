import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { API, apiPath } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { roleLabel } from "../../lib/permissions";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/use-modal";
import { Select } from "../../components/ui/select";
import { toast } from "../../components/ui/toast";
import { ASSIGNABLE_ROLES } from "./member-roles";

export interface EditMemberTarget {
  id: string;
  name: string;
  role: string;
}

/**
 * Changement de rôle partagé (liste + page détail).
 * `key={member.id}` côté appelant pour réinitialiser l'état par membre.
 */
export function EditMemberRoleModal({
  member,
  onClose,
}: {
  member: EditMemberTarget;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState(member.role);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.patch(apiPath.withId(API.userEstablishments, member.id), {
          role,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.members });
      queryClient.invalidateQueries({ queryKey: ["member", member.id] });
      toast.success("Rôle modifié avec succès");
      onClose();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!role) {
      setError("Choisissez un rôle");
      return;
    }
    setError(null);
    try {
      await mutation.mutateAsync();
    } catch {
      // Erreur déjà affichée via onError.
    }
  };

  return (
    <Modal.Root open onOpenChange={(open) => !open && onClose()}>
      <Modal.Content labelledBy="member-role-title">
        <Modal.Header>
          <Modal.Title id="member-role-title">
            Modifier le rôle de {member.name}
          </Modal.Title>
          <Modal.Description>
            Rôle actuel : {roleLabel(member.role)}.
          </Modal.Description>
        </Modal.Header>
        <Modal.Body>
          <form
            id="member-role-form"
            onSubmit={handleSubmit}
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
                value={role}
                onChange={setRole}
                disableSearch
              />
            </div>
            {error && (
              <p role="alert" className="text-r14 text-(--common-red)">
                {error}
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
            form="member-role-form"
            variant={mutation.isPending ? "loading" : "primary"}
            disabled={mutation.isPending}
          >
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
