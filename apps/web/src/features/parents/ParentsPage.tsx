import { canManageSchool } from "../../lib/roles";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { z } from "zod";
import { CrudPage } from "../../components/crud/CrudPage";
import { useAuthStore } from "../../stores/auth-store";
import {
  omitEmptyStrings,
  optionalUuidString,
} from "../../components/crud/crud-helpers";

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  profession: string | null;
  address: string | null;
  userId: string | null;
}

const schema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  profession: z.string().optional(),
  address: z.string().optional(),
  userId: optionalUuidString(),
});

const fullName = (parent: Parent) => `${parent.lastName} ${parent.firstName}`;

export default function ParentsPage() {
  const role = useAuthStore((state) => state.role);
  // Lecture seule hors DIRECTOR/ADMIN (matrice : CENSEUR, SURVEILLANT consultent).
  return (
    <CrudPage<Parent>
      readOnly={!canManageSchool(role)}
      title="Parents"
      description="Les parents et tuteurs, à lier aux élèves depuis la page dédiée."
      itemLabel="parent"
      createLabel="Nouveau parent"
      queryKey={KEYS.parents}
      endpoint={API.parents}
      columns={[
        { header: "Parent", primary: true, render: fullName },
        { header: "Téléphone", render: (parent) => parent.phone || "—" },
        { header: "Email", render: (parent) => parent.email || "—" },
        { header: "Profession", render: (parent) => parent.profession || "—" },
      ]}
      fields={[
        { name: "firstName", label: "Prénom", type: "text", required: true },
        { name: "lastName", label: "Nom", type: "text", required: true },
        { name: "phone", label: "Téléphone", type: "text" },
        { name: "email", label: "Email", type: "text" },
        { name: "profession", label: "Profession", type: "text" },
        { name: "address", label: "Adresse", type: "text" },
        {
          name: "userId",
          label: "Compte utilisateur",
          type: "text",
          placeholder: "UUID du compte (optionnel)",
          helperText: "Lier ce dossier à un compte membre de l'établissement.",
        },
      ]}
      schema={schema}
      toDefaults={(parent) => ({
        firstName: parent?.firstName ?? "",
        lastName: parent?.lastName ?? "",
        phone: parent?.phone ?? "",
        email: parent?.email ?? "",
        profession: parent?.profession ?? "",
        address: parent?.address ?? "",
        userId: parent?.userId ?? "",
      })}
      toSubmit={(values) =>
        omitEmptyStrings({
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          email: values.email,
          profession: values.profession,
          address: values.address,
          userId: values.userId,
        })
      }
      nameOf={fullName}
    />
  );
}
