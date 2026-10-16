import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { API, apiPath } from "../../lib/api-endpoints";
import { ROUTES } from "../../lib/routes";
import { PageHeader } from "../../layouts/PageHeader";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { ListSkeleton } from "../../components/data-list/ListSkeleton";
import { StatusPill } from "../../components/data-list/StatusPill";
import {
  DetailFields,
  DetailRow,
  DetailSection,
  HairlineList,
} from "../../components/detail/DetailSection";
import { ENROLLMENT_PILL } from "../../lib/status-meta";
import { unwrapList, type PaginatedList } from "../../hooks/use-crud";

interface ClassroomDossier {
  id: string;
  name: string;
  capacity: number | null;
  academicYear: { id: string; name: string };
  level: { id: string; name: string };
  series: { id: string; name: string } | null;
}

interface EnrollmentRow {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  student: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string | null;
  };
}

interface ScheduleRow {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  subject: { id: string; name: string };
  teacher: { id: string; firstName: string; lastName: string } | null;
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

export default function ClassroomDetailPage() {
  const { id } = useParams<{ id: string }>();

  const classroom = useQuery({
    queryKey: ["classroom", id],
    queryFn: async () =>
      (await api.get<ClassroomDossier>(apiPath.withId(API.classrooms, id!)))
        .data,
    enabled: !!id,
  });
  const enrollments = useQuery({
    queryKey: ["classroom-enrollments", id],
    queryFn: async () => {
      const raw = (
        await api.get<EnrollmentRow[] | PaginatedList<EnrollmentRow>>(
          API.enrollments,
          { params: { classroomId: id!, limit: 100 } },
        )
      ).data;
      return unwrapList(raw).items;
    },
    enabled: !!id && classroom.isSuccess,
  });
  const schedules = useQuery({
    queryKey: ["classroom-schedules", id],
    queryFn: async () =>
      (await api.get<ScheduleRow[]>(apiPath.schedulesByClassroom(id!))).data,
    enabled: !!id && classroom.isSuccess,
  });

  if (classroom.isPending) {
    return (
      <div>
        <PageHeader
          title="Classe"
          backTo={ROUTES.classrooms}
          backLabel="Classes"
        />
        <ListSkeleton label="Chargement de la classe" />
      </div>
    );
  }

  if (classroom.isError) {
    return (
      <div>
        <PageHeader
          title="Classe"
          backTo={ROUTES.classrooms}
          backLabel="Classes"
        />
        <ErrorState
          title="Impossible de charger cette classe"
          message={getErrorMessage(classroom.error)}
          onRetry={() => void classroom.refetch()}
        />
      </div>
    );
  }

  const dossier = classroom.data;
  const dossierFields: Array<[string, string]> = [
    ["Niveau", dossier.level.name],
    ["Série", dossier.series?.name ?? "—"],
    ["Année scolaire", dossier.academicYear.name],
    ["Effectif max", dossier.capacity != null ? String(dossier.capacity) : "—"],
  ];

  return (
    <div>
      <PageHeader
        title={dossier.name}
        description={`${dossier.level.name} • ${dossier.academicYear.name}`}
        backTo={ROUTES.classrooms}
        backLabel="Classes"
      />

      <div className="flex flex-col gap-p8 pb-p10">
        <DetailSection title="Informations">
          <DetailFields fields={dossierFields} />
        </DetailSection>

        <DetailSection
          title="Élèves inscrits"
          count={enrollments.data?.length ?? 0}
        >
          {enrollments.isPending ? (
            <ListSkeleton label="Chargement des inscrits" rows={3} />
          ) : (enrollments.data ?? []).length === 0 ? (
            <EmptyState
              title="Aucun inscrit"
              description="Aucun élève inscrit dans cette classe pour le moment."
            />
          ) : (
            <HairlineList
              items={enrollments.data ?? []}
              idOf={(row) => row.id}
              render={(row) => {
                const meta = ENROLLMENT_PILL[row.status];
                return (
                  <DetailRow
                    primary={`${row.student.lastName} ${row.student.firstName}`}
                    secondary={row.student.matricule ?? undefined}
                    right={
                      <StatusPill label={meta.label} variant={meta.variant} />
                    }
                  />
                );
              }}
            />
          )}
        </DetailSection>

        <DetailSection
          title="Emploi du temps"
          count={schedules.data?.length ?? 0}
        >
          {schedules.isPending ? (
            <ListSkeleton label="Chargement des créneaux" rows={3} />
          ) : (schedules.data ?? []).length === 0 ? (
            <EmptyState
              title="Aucun créneau"
              description="Aucun cours planifié pour cette classe."
            />
          ) : (
            <HairlineList
              items={schedules.data ?? []}
              idOf={(row) => row.id}
              render={(row) => (
                <DetailRow
                  primary={`${DAY_LABELS[row.dayOfWeek] ?? row.dayOfWeek} ${row.startTime} – ${row.endTime}`}
                  secondary={`${row.subject.name}${row.teacher ? ` • ${row.teacher.lastName} ${row.teacher.firstName}` : ""}${row.room ? ` • Salle ${row.room}` : ""}`}
                />
              )}
            />
          )}
        </DetailSection>
      </div>
    </div>
  );
}
