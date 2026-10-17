import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { API, apiPath } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { canManageSchool } from "../../lib/roles";
import { useAuthStore } from "../../stores/auth-store";
import { Button } from "../../components/ui/button";
import { FormDialog } from "../../components/crud/CrudPage";
import { ErrorState } from "../../components/ui/empty-state";
import { ListHeader } from "../../components/data-list/ListHeader";
import { ListSkeleton } from "../../components/data-list/ListSkeleton";
import { unwrapList, type PaginatedList } from "../../hooks/use-crud";
import { StatusPill } from "../../components/data-list/StatusPill";
import { toast } from "../../components/ui/toast";
import {
  DetailContainer,
  DetailFields,
  DetailRow,
  DetailSection,
  DetailStat,
  HairlineList,
  StickyBar,
} from "../../components/detail/DetailSection";
import {
  fullName as studentFullName,
  studentFields,
  studentSchema,
  studentToDefaults,
  studentToSubmit,
  type Student,
} from "./student-form";
import {
  DISCIPLINE_PILL,
  ENROLLMENT_PILL,
  RELATION_LABELS,
  attendanceRateBand,
  averageBand,
} from "../../lib/status-meta";
import { formatDateFr } from "../../components/crud/crud-helpers";
import { genderLabel } from "../../lib/gender";

/** « 1 note » / « 2 notes » pour les synthèses compactes. */
const plural = (count: number, word: string) =>
  `${count} ${word}${count > 1 ? "s" : ""}`;

interface StudentDossier {
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

interface EnrollmentRow {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  studentId: string;
  classroom: { id: string; name: string };
  academicYear: { id: string; name: string };
}

interface ParentLink {
  id: string;
  relation: "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER";
  isPrimary: boolean;
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  };
}

interface GradeRow {
  id: string;
  score: number | null;
  isAbsent: boolean;
  appreciation: string | null;
  exam: {
    id: string;
    name: string;
    maxScore: number;
    examDate: string | null;
    subject: { id: string; name: string };
  };
}

interface AttendanceRow {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  classroom: { id: string; name: string };
}

interface DisciplineRow {
  id: string;
  type: string;
  status: "PENDING" | "ACTIVE" | "RESOLVED" | "CANCELLED";
  title: string;
  incidentDate: string;
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.role);
  const canEdit = canManageSchool(role);
  const [editOpen, setEditOpen] = useState(false);

  const student = useQuery({
    queryKey: ["student", id],
    queryFn: async () =>
      (await api.get<StudentDossier>(apiPath.withId(API.students, id!))).data,
    enabled: !!id,
  });
  // Total pour le compteur du header (langage liste, comme EPL).
  const studentsTotal = useQuery({
    queryKey: ["students-total"],
    queryFn: async () => {
      const raw = (
        await api.get<StudentDossier[] | PaginatedList<StudentDossier>>(
          API.students,
          { params: { limit: 1 } },
        )
      ).data;
      return unwrapList(raw).pagination?.total_count ?? 0;
    },
  });
  const enrollments = useQuery({
    queryKey: ["student-enrollments", id],
    queryFn: async () => (await api.get<EnrollmentRow[]>(API.enrollments)).data,
    enabled: !!id && student.isSuccess,
    select: (rows) => rows.filter((row) => row.studentId === id),
  });
  const parents = useQuery({
    queryKey: ["student-parents", id],
    queryFn: async () =>
      (await api.get<ParentLink[]>(apiPath.parentStudentsOfStudent(id!))).data,
    enabled: !!id && student.isSuccess,
  });
  const grades = useQuery({
    queryKey: ["student-grades", id],
    queryFn: async () =>
      (await api.get<GradeRow[]>(apiPath.gradesByStudent(id!))).data,
    enabled: !!id && student.isSuccess,
  });
  const attendances = useQuery({
    queryKey: ["student-attendances", id],
    queryFn: async () =>
      (await api.get<AttendanceRow[]>(apiPath.attendancesByStudent(id!))).data,
    enabled: !!id && student.isSuccess,
  });
  const discipline = useQuery({
    queryKey: ["student-discipline", id],
    queryFn: async () =>
      (await api.get<DisciplineRow[]>(apiPath.disciplineByStudent(id!))).data,
    enabled: !!id && student.isSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      (await api.patch(apiPath.withId(API.students, id!), data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: KEYS.students });
      toast.success("Modifications enregistrées");
      setEditOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleUpdate = (values: Record<string, string>) =>
    updateMutation.mutateAsync(studentToSubmit(values));

  if (student.isPending) {
    return (
      <div>
        <StickyBar>
          <ListHeader
            title="Élèves"
            count={studentsTotal.data ?? 0}
            countLabel="élèves"
          />
        </StickyBar>
        <ListSkeleton label="Chargement du dossier" />
      </div>
    );
  }

  if (student.isError) {
    return (
      <div>
        <StickyBar>
          <ListHeader
            title="Élèves"
            count={studentsTotal.data ?? 0}
            countLabel="élèves"
          />
        </StickyBar>
        <ErrorState
          title="Impossible de charger ce dossier"
          message={getErrorMessage(student.error)}
          onRetry={() => void student.refetch()}
        />
      </div>
    );
  }

  const dossier = student.data;
  const fullName = `${dossier.lastName} ${dossier.firstName}`;

  // Assiduité : les excusés sont exclus du calcul (ni présents ni comptés).
  const attendanceRows = attendances.data ?? [];
  const attendanceCounts = attendanceRows.reduce(
    (acc, row) => ({ ...acc, [row.status]: (acc[row.status] ?? 0) + 1 }),
    {} as Record<AttendanceRow["status"], number>,
  );
  const countedAttendances =
    (attendanceCounts.PRESENT ?? 0) +
    (attendanceCounts.ABSENT ?? 0) +
    (attendanceCounts.LATE ?? 0);
  const attendanceRate =
    countedAttendances > 0
      ? Math.round(
          (((attendanceCounts.PRESENT ?? 0) + (attendanceCounts.LATE ?? 0)) /
            countedAttendances) *
            100,
        )
      : null;

  // Notes : moyenne sur 20 des notes chiffrées (absences exclues).
  const gradeRows = grades.data ?? [];
  const scoredGrades = gradeRows.filter(
    (grade) => !grade.isAbsent && grade.score !== null,
  );
  const gradeAbsences = gradeRows.length - scoredGrades.length;
  const average =
    scoredGrades.length > 0
      ? scoredGrades.reduce(
          (sum, grade) =>
            sum + ((grade.score ?? 0) / (grade.exam.maxScore || 20)) * 20,
          0,
        ) / scoredGrades.length
      : null;

  const dossierFields: Array<[string, string]> = [
    ["Matricule", dossier.matricule || "—"],
    ["Genre", genderLabel(dossier.gender)],
    ["Naissance", formatDateFr(dossier.dateOfBirth)],
    ["Lieu de naissance", dossier.placeOfBirth || "—"],
    ["Téléphone", dossier.phone || "—"],
    ["Adresse", dossier.address || "—"],
  ];

  const dossierForForm: Student = {
    id: dossier.id,
    firstName: dossier.firstName,
    lastName: dossier.lastName,
    matricule: dossier.matricule,
    gender: dossier.gender,
    dateOfBirth: dossier.dateOfBirth,
    placeOfBirth: dossier.placeOfBirth,
    phone: dossier.phone,
    address: dossier.address,
    userId: dossier.userId,
  };

  const editButton = canEdit ? (
    <Button
      variant="tag"
      fullWidth={false}
      title="Modifier"
      onClick={() => setEditOpen(true)}
    >
      Modifier
    </Button>
  ) : undefined;

  return (
    <div>
      <StickyBar>
        <ListHeader
          title="Élèves"
          count={studentsTotal.data ?? 0}
          countLabel="élèves"
          extra={editButton}
        />
      </StickyBar>

      <FormDialog
        key={dossier.id}
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) setEditOpen(false);
        }}
        title={`Modifier ${studentFullName(dossierForForm)}`}
        submitLabel="Enregistrer"
        fields={studentFields}
        schema={studentSchema}
        defaults={studentToDefaults(dossierForForm)}
        pending={updateMutation.isPending}
        columns={2}
        onSubmit={handleUpdate}
      />

      <DetailContainer>
        <h2 className="font-semibold text-sb24 leading-9 text-(--skools-text-primary)">
          {fullName}
        </h2>

        <DetailSection title="Dossier">
          <DetailFields fields={dossierFields} />
        </DetailSection>

        {(enrollments.isPending || (enrollments.data ?? []).length > 0) && (
          <DetailSection
            title="Inscriptions"
            count={enrollments.data?.length ?? 0}
          >
            {enrollments.isPending ? (
              <ListSkeleton label="Chargement des inscriptions" rows={2} />
            ) : (
              <HairlineList
                items={enrollments.data ?? []}
                idOf={(row) => row.id}
                render={(row) => {
                  const meta = ENROLLMENT_PILL[row.status];
                  return (
                    <DetailRow
                      primary={row.classroom.name}
                      secondary={row.academicYear.name}
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

        {(parents.isPending || (parents.data ?? []).length > 0) && (
          <DetailSection title="Parents" count={parents.data?.length ?? 0}>
            {parents.isPending ? (
              <ListSkeleton label="Chargement des parents" rows={2} />
            ) : (
              <HairlineList
                items={parents.data ?? []}
                idOf={(link) => link.id}
                render={(link) => (
                  <DetailRow
                    primary={`${link.parent.lastName} ${link.parent.firstName}`}
                    secondary={`${RELATION_LABELS[link.relation]}${link.isPrimary ? " • Contact principal" : ""}${link.parent.phone ? ` • ${link.parent.phone}` : ""}`}
                  />
                )}
              />
            )}
          </DetailSection>
        )}

        {(grades.isPending || scoredGrades.length > 0) && (
          <DetailSection title="Notes">
            {grades.isPending ? (
              <ListSkeleton label="Chargement des notes" rows={2} />
            ) : (
              average !== null && (
                <DetailStat
                  badge={<StatusPill {...averageBand(average)} />}
                  value={`${average.toFixed(1)}/20 de moyenne`}
                  caption={[
                    plural(scoredGrades.length, "note"),
                    gradeAbsences > 0 ? plural(gradeAbsences, "absence") : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                />
              )
            )}
          </DetailSection>
        )}

        {(attendances.isPending || attendanceRate !== null) && (
          <DetailSection title="Assiduité">
            {attendances.isPending ? (
              <ListSkeleton label="Chargement de l'assiduité" rows={2} />
            ) : (
              attendanceRate !== null && (
                <DetailStat
                  badge={<StatusPill {...attendanceRateBand(attendanceRate)} />}
                  value={`${attendanceRate}% de présence`}
                  caption={[
                    plural(attendanceCounts.PRESENT ?? 0, "présent"),
                    plural(attendanceCounts.ABSENT ?? 0, "absent"),
                    plural(attendanceCounts.LATE ?? 0, "retard"),
                    (attendanceCounts.EXCUSED ?? 0) > 0
                      ? plural(attendanceCounts.EXCUSED ?? 0, "excusé")
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                />
              )
            )}
          </DetailSection>
        )}

        {(discipline.isPending || (discipline.data ?? []).length > 0) && (
          <DetailSection
            title="Discipline"
            count={discipline.data?.length ?? 0}
          >
            {discipline.isPending ? (
              <ListSkeleton label="Chargement des fiches" rows={2} />
            ) : (
              <HairlineList
                items={discipline.data ?? []}
                idOf={(row) => row.id}
                render={(row) => {
                  const meta = DISCIPLINE_PILL[row.status];
                  return (
                    <DetailRow
                      primary={row.title}
                      secondary={formatDateFr(row.incidentDate)}
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
      </DetailContainer>
    </div>
  );
}
