import { z } from "zod";
import { CrudPage } from "../../components/crud/CrudPage";
import { omitEmptyStrings, optionalUuidString } from "../../components/crud/crud-helpers";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  address: string | null;
  userId: string | null;
}

const schema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  matricule: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  specialty: z.string().optional(),
  address: z.string().optional(),
  userId: optionalUuidString(),
});

const fullName = (teacher: Teacher) => `${teacher.lastName} ${teacher.firstName}`;

export default function TeachersPage() {
  return (
    <CrudPage<Teacher>
      title="Enseignants"
      description="Les enseignants de l'établissement et leurs spécialités."
      itemLabel="enseignant"
      createLabel="Nouvel enseignant"
      queryKey={["teachers"]}
      endpoint="/teachers"
      columns={[
        { header: "Enseignant", primary: true, render: fullName },
        { header: "Spécialité", render: (teacher) => teacher.specialty || "—" },
        { header: "Email", render: (teacher) => teacher.email || "—" },
        { header: "Téléphone", render: (teacher) => teacher.phone || "—" },
      ]}
      fields={[
        { name: "firstName", label: "Prénom", type: "text", required: true },
        { name: "lastName", label: "Nom", type: "text", required: true },
        { name: "matricule", label: "Matricule", type: "text" },
        { name: "gender", label: "Genre", type: "text", placeholder: "Ex : Féminin, Masculin" },
        { name: "phone", label: "Téléphone", type: "text" },
        { name: "email", label: "Email", type: "text", placeholder: "Ex : awa.diallo@ecole.sn" },
        { name: "specialty", label: "Spécialité", type: "text", placeholder: "Ex : Mathématiques" },
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
      toDefaults={(teacher) => ({
        firstName: teacher?.firstName ?? "",
        lastName: teacher?.lastName ?? "",
        matricule: teacher?.matricule ?? "",
        gender: teacher?.gender ?? "",
        phone: teacher?.phone ?? "",
        email: teacher?.email ?? "",
        specialty: teacher?.specialty ?? "",
        address: teacher?.address ?? "",
        userId: teacher?.userId ?? "",
      })}
      toSubmit={(values) =>
        omitEmptyStrings({
          firstName: values.firstName,
          lastName: values.lastName,
          matricule: values.matricule,
          gender: values.gender,
          phone: values.phone,
          email: values.email,
          specialty: values.specialty,
          address: values.address,
          userId: values.userId,
        })
      }
      nameOf={fullName}
    />
  );
}
