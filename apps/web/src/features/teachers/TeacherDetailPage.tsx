import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { API, apiPath } from "../../lib/api-endpoints";
import { ROUTES } from "../../lib/routes";
import { PageHeader } from "../../layouts/PageHeader";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { ListSkeleton } from "../../components/data-list/ListSkeleton";
import {
  DetailFields,
  DetailRow,
  DetailSection,
  HairlineList,
} from "../../components/detail/DetailSection";

interface TeacherDossier {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  specialty: string | null;
}

interface AssignmentRow {
  id: string;
  teacherId: string;
  subject: { id: string; name: string };
  classroom: { id: string; name: string };
  academicYear: { id: string; name: string; isCurrent: boolean };
}

function genderLabel(gender: string | null) {
  if (gender === "M") return "Masculin";
  if (gender === "F") return "Féminin";
  return gender || "—";
}

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();

  const teacher = useQuery({
    queryKey: ["teacher", id],
    queryFn: async () =>
      (await api.get<TeacherDossier>(apiPath.withId(API.teachers, id!))).data,
    enabled: !!id,
  });
  const assignments = useQuery({
    queryKey: ["teacher-assignments", id],
    queryFn: async () =>
      (await api.get<AssignmentRow[]>(API.teacherAssignments)).data,
    enabled: !!id && teacher.isSuccess,
    select: (rows) => rows.filter((row) => row.teacherId === id),
  });

  if (teacher.isPending) {
    return (
      <div>
        <PageHeader title="Enseignant" backTo={ROUTES.teachers} backLabel="Enseignants" />
        <ListSkeleton label="Chargement du dossier" />
      </div>
    );
  }

  if (teacher.isError) {
    return (
      <div>
        <PageHeader title="Enseignant" backTo={ROUTES.teachers} backLabel="Enseignants" />
        <ErrorState
          title="Impossible de charger ce dossier"
          message={getErrorMessage(teacher.error)}
          onRetry={() => void teacher.refetch()}
        />
      </div>
    );
  }

  const dossier = teacher.data;
  const fullName = `${dossier.lastName} ${dossier.firstName}`;

  const dossierFields: Array<[string, string]> = [
    ["Matricule", dossier.matricule || "—"],
    ["Genre", genderLabel(dossier.gender)],
    ["Spécialité", dossier.specialty || "—"],
    ["Téléphone", dossier.phone || "—"],
    ["Email", dossier.email || "—"],
    ["Adresse", dossier.address || "—"],
  ];

  return (
    <div>
      <PageHeader
        title={fullName}
        description={dossier.specialty ?? undefined}
        backTo={ROUTES.teachers}
        backLabel="Enseignants"
      />

      <div className="flex flex-col gap-p8 pb-p10">
        <DetailSection title="Dossier">
          <DetailFields fields={dossierFields} />
        </DetailSection>

        <DetailSection title="Affectations" count={assignments.data?.length ?? 0}>
          {assignments.isPending ? (
            <ListSkeleton label="Chargement des affectations" rows={2} />
          ) : (assignments.data ?? []).length === 0 ? (
            <EmptyState
              title="Aucune affectation"
              description="Cet enseignant n'est affecté à aucune classe pour le moment."
            />
          ) : (
            <HairlineList
              items={assignments.data ?? []}
              idOf={(row) => row.id}
              render={(row) => (
                <DetailRow
                  primary={`${row.subject.name} — ${row.classroom.name}`}
                  secondary={`${row.academicYear.name}${row.academicYear.isCurrent ? " (En cours)" : ""}`}
                />
              )}
            />
          )}
        </DetailSection>
      </div>
    </div>
  );
}
