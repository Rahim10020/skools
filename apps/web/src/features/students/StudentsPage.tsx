import { canManageSchool } from "../../lib/roles";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { ROUTES } from "../../lib/routes";
import { useQuery } from "@tanstack/react-query";
import { CrudPage } from "../../components/crud/CrudPage";
import { useAuthStore } from "../../stores/auth-store";
import api from "../../lib/api";
import type { IdName } from "../../types/api";
import { formatDateFr } from "../../components/crud/crud-helpers";
import {
  fullName,
  studentFields,
  studentSchema,
  studentToCsvRow,
  studentToDefaults,
  studentToSubmit,
  type Student,
} from "./student-form";

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
      toCsvRow={studentToCsvRow}
      columns={[
        { header: "Élève", primary: true, render: fullName },
        { header: "Matricule", render: (student) => student.matricule || "—" },
        {
          header: "Naissance",
          render: (student) => formatDateFr(student.dateOfBirth),
        },
        { header: "Téléphone", render: (student) => student.phone || "—" },
      ]}
      fields={studentFields}
      schema={studentSchema}
      toDefaults={studentToDefaults}
      toSubmit={studentToSubmit}
      nameOf={fullName}
    />
  );
}
