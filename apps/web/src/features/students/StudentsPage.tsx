import { useState } from "react";
import { canManageSchool } from "../../lib/roles";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { ROUTES } from "../../lib/routes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CrudPage } from "../../components/crud/CrudPage";
import {
  CsvImportDialog,
  type ImportResult,
} from "../../components/crud/CsvImportDialog";
import { Button } from "../../components/ui/button";
import { useAuthStore } from "../../stores/auth-store";
import { toast } from "../../components/ui/toast";
import api from "../../lib/api";
import type { IdName } from "../../types/api";
import { formatDateFr } from "../../components/crud/crud-helpers";
import { UploadIcon } from "../../components/icons/UploadIcon";
import {
  fullName,
  studentFields,
  studentSchema,
  studentToCsvRow,
  studentToDefaults,
  studentToSubmit,
  type Student,
} from "./student-form";
import {
  STUDENT_IMPORT_COLUMNS,
  STUDENT_IMPORT_EXAMPLE,
  STUDENT_IMPORT_PREVIEW_KEYS,
  normalizeStudentImportRow,
} from "./student-import";

export default function StudentsPage() {
  const role = useAuthStore((state) => state.role);
  const queryClient = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);
  const canManage = canManageSchool(role);

  const classroomsQuery = useQuery({
    queryKey: KEYS.classrooms,
    queryFn: async () => (await api.get<IdName[]>(API.classrooms)).data,
  });

  const importMutation = useMutation({
    mutationFn: async (students: Record<string, string>[]) =>
      (await api.post<ImportResult>(`${API.students}/bulk`, { students })).data,
  });

  const handleImport = async (rows: Record<string, string>[]) => {
    const result = await importMutation.mutateAsync(rows);
    queryClient.invalidateQueries({ queryKey: KEYS.students });
    if (result.created > 0) {
      toast.success(`${result.created} élève(s) importé(s)`);
    }
    return result;
  };

  const importButton = canManage ? (
    <Button
      variant="tag"
      fullWidth={false}
      icon={<UploadIcon className="size-full" />}
      iconPosition="left"
      title="Importer des élèves"
      onClick={() => setImportOpen(true)}
    >
      Importer
    </Button>
  ) : undefined;

  // Lecture seule hors DIRECTOR/ADMIN (matrice : CENSEUR, SURVEILLANT consultent).
  return (
    <>
      <CrudPage<Student>
        readOnly={!canManage}
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
        headerActions={importButton}
        filters={[
          {
            key: "gender",
            label: "Genre",
            param: "gender",
            options: [
              { label: "Filles", value: "Féminin" },
              { label: "Garçons", value: "Masculin" },
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
          {
            header: "Matricule",
            render: (student) => student.matricule || "—",
          },
          {
            header: "Naissance",
            render: (student) => formatDateFr(student.dateOfBirth),
          },
          { header: "Téléphone", render: (student) => student.phone || "—" },
        ]}
        fields={studentFields}
        formColumns={2}
        schema={studentSchema}
        toDefaults={studentToDefaults}
        toSubmit={studentToSubmit}
        nameOf={fullName}
      />

      <CsvImportDialog
        key={importOpen ? "open" : "closed"}
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importer des élèves"
        description="Collez les données dans un CSV : chaque ligne crée un élève. Une colonne « Classe » (optionnelle) inscrit l'élève à l'année en cours."
        itemLabel="élève"
        columns={STUDENT_IMPORT_COLUMNS}
        exampleRow={STUDENT_IMPORT_EXAMPLE}
        templateFilename="modele-eleves"
        previewKeys={STUDENT_IMPORT_PREVIEW_KEYS}
        normalize={normalizeStudentImportRow}
        onSubmit={handleImport}
      />
    </>
  );
}
