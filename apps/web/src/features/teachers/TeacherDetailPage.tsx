import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { API, apiPath } from "../../lib/api-endpoints";
import { ErrorState } from "../../components/ui/empty-state";
import { ListHeader } from "../../components/data-list/ListHeader";
import { ListSkeleton } from "../../components/data-list/ListSkeleton";
import {
  DetailContainer,
  DetailFields,
  DetailRow,
  DetailSection,
  HairlineList,
  StickyBar,
} from "../../components/detail/DetailSection";
import { unwrapList, type PaginatedList } from "../../hooks/use-crud";

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
  // Total pour le compteur du header (langage liste).
  const teachersTotal = useQuery({
    queryKey: ["teachers-total"],
    queryFn: async () => {
      const raw = (
        await api.get<TeacherDossier[] | PaginatedList<TeacherDossier>>(
          API.teachers,
          { params: { limit: 1 } },
        )
      ).data;
      return unwrapList(raw).pagination?.total_count ?? 0;
    },
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
        <StickyBar>
          <ListHeader
            title="Enseignants"
            count={teachersTotal.data ?? 0}
            countLabel="enseignants"
          />
        </StickyBar>
        <ListSkeleton label="Chargement du dossier" />
      </div>
    );
  }

  if (teacher.isError) {
    return (
      <div>
        <StickyBar>
          <ListHeader
            title="Enseignants"
            count={teachersTotal.data ?? 0}
            countLabel="enseignants"
          />
        </StickyBar>
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
      <StickyBar>
        <ListHeader
          title="Enseignants"
          count={teachersTotal.data ?? 0}
          countLabel="enseignants"
        />
      </StickyBar>

      <DetailContainer>
        <h2 className="font-semibold text-sb24 leading-9 text-(--skools-text-primary)">
          {fullName}
        </h2>

        <DetailSection title="Dossier">
          <DetailFields fields={dossierFields} />
        </DetailSection>

        {(assignments.isPending || (assignments.data ?? []).length > 0) && (
          <DetailSection title="Affectations" count={assignments.data?.length ?? 0}>
            {assignments.isPending ? (
              <ListSkeleton label="Chargement des affectations" rows={2} />
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
        )}
      </DetailContainer>
    </div>
  );
}
