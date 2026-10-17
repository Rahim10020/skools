import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { API, apiPath } from "../../lib/api-endpoints";
import { ErrorState } from "../../components/ui/empty-state";
import { ListHeader } from "../../components/data-list/ListHeader";
import { ListSkeleton } from "../../components/data-list/ListSkeleton";
import { StatusPill } from "../../components/data-list/StatusPill";
import {
  DetailContainer,
  DetailFields,
  DetailRow,
  DetailSection,
  HairlineList,
  StickyBar,
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
  // Total pour le compteur du header (langage liste).
  const classroomsTotal = useQuery({
    queryKey: ["classrooms-total"],
    queryFn: async () => {
      const raw = (
        await api.get<ClassroomDossier[] | PaginatedList<ClassroomDossier>>(
          API.classrooms,
          { params: { limit: 1 } },
        )
      ).data;
      return unwrapList(raw).pagination?.total_count ?? 0;
    },
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
        <StickyBar>
          <ListHeader
            title="Classes"
            count={classroomsTotal.data ?? 0}
            countLabel="classes"
          />
        </StickyBar>
        <ListSkeleton label="Chargement de la classe" />
      </div>
    );
  }

  if (classroom.isError) {
    return (
      <div>
        <StickyBar>
          <ListHeader
            title="Classes"
            count={classroomsTotal.data ?? 0}
            countLabel="classes"
          />
        </StickyBar>
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
      <StickyBar>
        <ListHeader
          title="Classes"
          count={classroomsTotal.data ?? 0}
          countLabel="classes"
        />
      </StickyBar>

      <DetailContainer>
        <h2 className="font-semibold text-sb24 leading-9 text-(--skools-text-primary)">
          {dossier.name}
        </h2>

        <DetailSection title="Informations">
          <DetailFields fields={dossierFields} />
        </DetailSection>

        {(enrollments.isPending || (enrollments.data ?? []).length > 0) && (
          <DetailSection
            title="Élèves inscrits"
            count={enrollments.data?.length ?? 0}
          >
            {enrollments.isPending ? (
              <ListSkeleton label="Chargement des inscrits" rows={3} />
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
        )}

        {(schedules.isPending || (schedules.data ?? []).length > 0) && (
          <DetailSection
            title="Emploi du temps"
            count={schedules.data?.length ?? 0}
          >
            {schedules.isPending ? (
              <ListSkeleton label="Chargement des créneaux" rows={3} />
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
        )}
      </DetailContainer>
    </div>
  );
}
