import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { API, apiPath } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { ROUTES } from "../../lib/routes";
import { canManageSchool } from "../../lib/roles";
import { useAuthStore } from "../../stores/auth-store";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/use-modal";
import { CrudFormModal } from "../../components/crud/CrudPage";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
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
  HairlineList,
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
  ATTENDANCE_PILL,
  DISCIPLINE_PILL,
  ENROLLMENT_PILL,
  RELATION_LABELS,
} from "../../lib/status-meta";
import { formatDateFr } from "../../components/crud/crud-helpers";

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

function genderLabel(gender: string | null) {
  if (gender === "M") return "Masculin";
  if (gender === "F") return "Féminin";
  return gender || "—";
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
    queryFn: async () =>
      (await api.get<EnrollmentRow[]>(API.enrollments)).data,
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
        <ListHeader
          title="Élèves"
          backTo={ROUTES.students}
          backLabel="Élèves"
          count={studentsTotal.data ?? 0}
          countLabel="élèves"
        />
        <ListSkeleton label="Chargement du dossier" />
      </div>
    );
  }

  if (student.isError) {
    return (
      <div>
        <ListHeader
          title="Élèves"
          backTo={ROUTES.students}
          backLabel="Élèves"
          count={studentsTotal.data ?? 0}
          countLabel="élèves"
        />
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
  const attendanceCounts = (attendances.data ?? []).reduce(
    (acc, row) => ({ ...acc, [row.status]: (acc[row.status] ?? 0) + 1 }),
    {} as Partial<Record<AttendanceRow["status"], number>>,
  );

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
      <ListHeader
        title="Élèves"
        backTo={ROUTES.students}
        backLabel="Élèves"
        count={studentsTotal.data ?? 0}
        countLabel="élèves"
        extra={editButton}
      />

      <Modal.Root
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) setEditOpen(false);
        }}
      >
        {editOpen && (
          <Modal.Content labelledBy="crud-form-title">
            <CrudFormModal
              key={dossier.id}
              title={`Modifier ${studentFullName(dossierForForm)}`}
              submitLabel="Enregistrer"
              fields={studentFields}
              schema={studentSchema}
              defaults={studentToDefaults(dossierForForm)}
              pending={updateMutation.isPending}
              onSubmit={handleUpdate}
            />
          </Modal.Content>
        )}
      </Modal.Root>

      <DetailContainer>
        <h2 className="font-semibold text-sb24 leading-9 text-(--skools-text-primary)">
          {fullName}
        </h2>

        <DetailSection title="Dossier">
          <DetailFields fields={dossierFields} />
        </DetailSection>

        <DetailSection title="Inscriptions" count={enrollments.data?.length ?? 0}>
          {enrollments.isPending ? (
            <ListSkeleton label="Chargement des inscriptions" rows={2} />
          ) : (enrollments.data ?? []).length === 0 ? (
            <EmptyState title="Aucune inscription" description="Cet élève n'est inscrit dans aucune classe pour le moment." />
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
                    right={<StatusPill label={meta.label} variant={meta.variant} />}
                  />
                );
              }}
            />
          )}
        </DetailSection>

        <DetailSection title="Parents" count={parents.data?.length ?? 0}>
          {parents.isPending ? (
            <ListSkeleton label="Chargement des parents" rows={2} />
          ) : (parents.data ?? []).length === 0 ? (
            <EmptyState title="Aucun parent lié" description="Utilisez « Lier parents » pour rattacher un parent à cet élève." />
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

        <DetailSection title="Dernières notes" count={grades.data?.length ?? 0}>
          {grades.isPending ? (
            <ListSkeleton label="Chargement des notes" rows={3} />
          ) : (grades.data ?? []).length === 0 ? (
            <EmptyState title="Aucune note" description="Aucune note saisie pour cet élève." />
          ) : (
            <HairlineList
              items={(grades.data ?? []).slice(0, 8)}
              idOf={(grade) => grade.id}
              render={(grade) => (
                <DetailRow
                  primary={`${grade.exam.subject.name} — ${grade.exam.name}`}
                  secondary={formatDateFr(grade.exam.examDate)}
                  right={
                    grade.isAbsent ? (
                      <StatusPill label="Absent" variant="destructive" />
                    ) : (
                      <span className="text-r14 font-medium text-(--skools-text-primary)">
                        {grade.score} / {grade.exam.maxScore}
                      </span>
                    )
                  }
                />
              )}
            />
          )}
        </DetailSection>

        <DetailSection title="Présences" count={attendances.data?.length ?? 0}>
          {attendances.isPending ? (
            <ListSkeleton label="Chargement des présences" rows={3} />
          ) : (attendances.data ?? []).length === 0 ? (
            <EmptyState title="Aucun appel" description="Aucune présence enregistrée pour cet élève." />
          ) : (
            <div className="flex flex-col gap-p3">
              <p className="text-r12 text-(--skools-text-muted)">
                {attendanceCounts.PRESENT ?? 0} présent(s) • {attendanceCounts.ABSENT ?? 0} absent(s) •{" "}
                {attendanceCounts.LATE ?? 0} retard(s) • {attendanceCounts.EXCUSED ?? 0} excusé(s)
              </p>
              <HairlineList
                items={(attendances.data ?? []).slice(0, 5)}
                idOf={(row) => row.id}
                render={(row) => {
                  const meta = ATTENDANCE_PILL[row.status];
                  return (
                    <DetailRow
                      primary={formatDateFr(row.date)}
                      secondary={row.classroom.name}
                      right={<StatusPill label={meta.label} variant={meta.variant} />}
                    />
                  );
                }}
              />
            </div>
          )}
        </DetailSection>

        <DetailSection title="Discipline" count={discipline.data?.length ?? 0}>
          {discipline.isPending ? (
            <ListSkeleton label="Chargement des fiches" rows={2} />
          ) : (discipline.data ?? []).length === 0 ? (
            <EmptyState title="Rien à signaler" description="Aucune fiche disciplinaire pour cet élève." />
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
                    right={<StatusPill label={meta.label} variant={meta.variant} />}
                  />
                );
              }}
            />
          )}
        </DetailSection>
      </DetailContainer>
    </div>
  );
}
