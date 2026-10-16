import { canManageSchool } from "../../lib/roles";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { ROUTES } from "../../lib/routes";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { CrudPage } from "../../components/crud/CrudPage";
import { useAuthStore } from "../../stores/auth-store";
import api from "../../lib/api";
import type { IdName } from "../../types/api";
import {
  formatDateFr,
  omitEmptyStrings,
  optionalUuidString,
  toDateInput,
} from "../../components/crud/crud-helpers";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  phone: string | null;
  address: string | null;
  userId: string | null;
}

const schema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  matricule: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  userId: optionalUuidString(),
});

const fullName = (student: Student) =>
  `${student.lastName} ${student.firstName}`;

export default function StudentsPage() {
  const role = useAuthStore((state) => state.role);
  const classroomsQuery = useQuery({
    queryKey: KEYS.classrooms,
    queryFn: async () => (await api.get<IdName[]>(API.classrooms)).data,
  });
  // Lecture seule hors DIRECTOR/ADMIN (matrice : CENSEUR, SURVEILLANT consultent).
  return (
    <CrudPage<Student>
      readOnly={!canManageSchool(role)}
      title="Élèves"
      description="Les dossiers des élèves de l'établissement."
      itemLabel="élève"
      pluralLabel="élèves"
      createLabel="Nouvel élève"
      queryKey={KEYS.students}
      endpoint={API.students}
      pageSize={10}
      rowTo={(student) => `${ROUTES.students}/${student.id}`}
      searchPlaceholder="Rechercher un élève…"
      filters={[
        {
          key: "gender",
          label: "Genre",
          param: "gender",
          options: [
            { label: "Filles", value: "F" },
            { label: "Garçons", value: "M" },
          ],
        },
        {
          key: "classroom",
          label: "Classe",
          param: "classroomId",
          options: (classroomsQuery.data ?? []).map((c) => ({
            label: c.name,
            value: c.id,
          })),
        },
      ]}
      csvFilename="eleves"
      csvHeaders={["Élève", "Matricule", "Naissance", "Téléphone"]}
      toCsvRow={(student) => [
        fullName(student),
        student.matricule ?? "",
        formatDateFr(student.dateOfBirth),
        student.phone ?? "",
      ]}
      columns={[
        { header: "Élève", primary: true, render: fullName },
        { header: "Matricule", render: (student) => student.matricule || "—" },
        {
          header: "Naissance",
          render: (student) => formatDateFr(student.dateOfBirth),
        },
        { header: "Téléphone", render: (student) => student.phone || "—" },
      ]}
      fields={[
        { name: "firstName", label: "Prénom", type: "text", required: true },
        { name: "lastName", label: "Nom", type: "text", required: true },
        { name: "matricule", label: "Matricule", type: "text" },
        {
          name: "gender",
          label: "Genre",
          type: "text",
          placeholder: "Ex : Féminin, Masculin",
        },
        { name: "dateOfBirth", label: "Date de naissance", type: "date" },
        { name: "placeOfBirth", label: "Lieu de naissance", type: "text" },
        { name: "phone", label: "Téléphone", type: "text" },
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
      toDefaults={(student) => ({
        firstName: student?.firstName ?? "",
        lastName: student?.lastName ?? "",
        matricule: student?.matricule ?? "",
        gender: student?.gender ?? "",
        dateOfBirth: toDateInput(student?.dateOfBirth),
        placeOfBirth: student?.placeOfBirth ?? "",
        phone: student?.phone ?? "",
        address: student?.address ?? "",
        userId: student?.userId ?? "",
      })}
      toSubmit={(values) =>
        omitEmptyStrings({
          firstName: values.firstName,
          lastName: values.lastName,
          matricule: values.matricule,
          gender: values.gender,
          dateOfBirth: values.dateOfBirth,
          placeOfBirth: values.placeOfBirth,
          phone: values.phone,
          address: values.address,
          userId: values.userId,
        })
      }
      nameOf={fullName}
    />
  );
}
