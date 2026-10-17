import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import api from "../../lib/api";
import { API, apiPath } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { roleLabel } from "../../lib/permissions";
import { FormDialog, type CrudFieldDef } from "../../components/crud/CrudPage";
import { toast } from "../../components/ui/toast";
import { ASSIGNABLE_ROLES } from "./member-roles";

export interface EditMemberTarget {
  id: string;
  name: string;
  role: string;
}

const roleSchema = z.object({
  role: z.string().min(1, "Choisissez un rôle"),
});

const roleFields: CrudFieldDef[] = [
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

  const mutation = useMutation({
    mutationFn: async (role: string) =>
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
  });

  const handleSubmit = async (values: Record<string, string>) => {
    await mutation.mutateAsync(values.role);
  };

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Modifier le rôle de ${member.name}`}
      description={`Rôle actuel : ${roleLabel(member.role)}.`}
      submitLabel="Enregistrer"
      fields={roleFields}
      schema={roleSchema}
      defaults={{ role: member.role }}
      pending={mutation.isPending}
      onSubmit={handleSubmit}
    />
  );
}
