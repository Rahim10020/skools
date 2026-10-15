import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { API, apiPath } from "../../lib/api-endpoints";
import { ROUTES } from "../../lib/routes";
import { PageHeader } from "../../layouts/PageHeader";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { ListSkeleton } from "../../components/data-list/ListSkeleton";
import { StatusPill, type StatusPillVariant } from "../../components/data-list/StatusPill";
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

const RELATION_LABELS: Record<ParentLink["relation"], string> = {
  FATHER: "Père",
  MOTHER: "Mère",
  GUARDIAN: "Tuteur",
  OTHER: "Autre",
};

const ENROLLMENT_PILL: Record<EnrollmentRow["status"], { label: string; variant: StatusPillVariant }> = {
  PENDING: { label: "En attente", variant: "neutral" },
  APPROVED: { label: "Approuvée", variant: "success" },
  REJECTED: { label: "Rejetée", variant: "destructive" },
  WITHDRAWN: { label: "Retirée", variant: "neutral" },
};

const ATTENDANCE_PILL: Record<AttendanceRow["status"], { label: string; variant: StatusPillVariant }> = {
  PRESENT: { label: "Présent", variant: "success" },
  ABSENT: { label: "Absent", variant: "destructive" },
  LATE: { label: "Retard", variant: "neutral" },
  EXCUSED: { label: "Excusé", variant: "default" },
};

const DISCIPLINE_PILL: Record<DisciplineRow["status"], { label: string; variant: StatusPillVariant }> = {
  PENDING: { label: "En attente", variant: "neutral" },
  ACTIVE: { label: "En cours", variant: "default" },
  RESOLVED: { label: "Résolue", variant: "success" },
  CANCELLED: { label: "Annulée", variant: "neutral" },
};

function genderLabel(gender: string | null) {
  if (gender === "M") return "Masculin";
  if (gender === "F") return "Féminin";
  return gender || "—";
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-p3">
      <h2 className="text-sb18 text-(--skools-text-primary)">
        {title}
        {count !== undefined && (
          <span className="ml-p2 text-r14 font-normal text-(--skools-text-muted)">
            ({count})
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

function Row({
  primary,
  secondary,
  right,
}: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_max-content] items-center gap-p3 py-p2">
      <div className="min-w-0">
        <p className="truncate text-r14 text-(--skools-text-primary)">{primary}</p>
        {secondary && (
          <p className="truncate text-r12 text-(--skools-text-muted)">{secondary}</p>
        )}
      </div>
      {right && <div className="flex items-center gap-p2">{right}</div>}
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const student = useQuery({
    queryKey: ["student", id],
    queryFn: async () =>
      (await api.get<StudentDossier>(apiPath.withId(API.students, id!))).data,
    enabled: !!id,
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

  if (student.isPending) {
    return (
      <div>
        <PageHeader title="Élève" backTo={ROUTES.students} backLabel="Élèves" />
        <ListSkeleton label="Chargement du dossier" />
      </div>
    );
  }

  if (student.isError) {
    return (
      <div>
        <PageHeader title="Élève" backTo={ROUTES.students} backLabel="Élèves" />
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

  return (
    <div>
      <PageHeader
        title={fullName}
        description={dossier.matricule ? `Matricule ${dossier.matricule}` : undefined}
        backTo={ROUTES.students}
        backLabel="Élèves"
      />

      <div className="flex flex-col gap-p8 pb-p10">
        <Section title="Dossier">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-p6">
            {dossierFields.map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-p3 py-p2 border-t-[0.4px] border-(--skools-border-subtle)"
              >
                <dt className="text-r12 text-(--skools-text-muted)">{label}</dt>
                <dd className="text-r14 text-(--skools-text-primary) text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Inscriptions" count={enrollments.data?.length ?? 0}>
          {enrollments.isPending ? (
            <ListSkeleton label="Chargement des inscriptions" rows={2} />
          ) : (enrollments.data ?? []).length === 0 ? (
            <EmptyState title="Aucune inscription" description="Cet élève n'est inscrit dans aucune classe pour le moment." />
          ) : (
            <div className="flex flex-col">
              {(enrollments.data ?? []).map((row, idx, arr) => {
                const meta = ENROLLMENT_PILL[row.status];
                return (
                  <div key={row.id} className="flex flex-col">
                    <Row
                      primary={row.classroom.name}
                      secondary={row.academicYear.name}
                      right={<StatusPill label={meta.label} variant={meta.variant} />}
                    />
                    {idx < arr.length - 1 && (
                      <hr className="border-t-[0.4px] border-(--skools-border-subtle) w-full" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Parents" count={parents.data?.length ?? 0}>
          {parents.isPending ? (
            <ListSkeleton label="Chargement des parents" rows={2} />
          ) : (parents.data ?? []).length === 0 ? (
            <EmptyState title="Aucun parent lié" description="Utilisez « Lier parents » pour rattacher un parent à cet élève." />
          ) : (
            <div className="flex flex-col">
              {(parents.data ?? []).map((link, idx, arr) => (
                <div key={link.id} className="flex flex-col">
                  <Row
                    primary={`${link.parent.lastName} ${link.parent.firstName}`}
                    secondary={`${RELATION_LABELS[link.relation]}${link.isPrimary ? " • Contact principal" : ""}${link.parent.phone ? ` • ${link.parent.phone}` : ""}`}
                  />
                  {idx < arr.length - 1 && (
                    <hr className="border-t-[0.4px] border-(--skools-border-subtle) w-full" />
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Dernières notes" count={grades.data?.length ?? 0}>
          {grades.isPending ? (
            <ListSkeleton label="Chargement des notes" rows={3} />
          ) : (grades.data ?? []).length === 0 ? (
            <EmptyState title="Aucune note" description="Aucune note saisie pour cet élève." />
          ) : (
            <div className="flex flex-col">
              {(grades.data ?? []).slice(0, 8).map((grade, idx, arr) => {
                const shown = arr.slice(0, 8);
                return (
                  <div key={grade.id} className="flex flex-col">
                    <Row
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
                    {idx < shown.length - 1 && (
                      <hr className="border-t-[0.4px] border-(--skools-border-subtle) w-full" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Présences" count={attendances.data?.length ?? 0}>
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
              <div className="flex flex-col">
                {(attendances.data ?? []).slice(0, 5).map((row, idx, arr) => {
                  const shown = arr.slice(0, 5);
                  const meta = ATTENDANCE_PILL[row.status];
                  return (
                    <div key={row.id} className="flex flex-col">
                      <Row
                        primary={formatDateFr(row.date)}
                        secondary={row.classroom.name}
                        right={<StatusPill label={meta.label} variant={meta.variant} />}
                      />
                      {idx < shown.length - 1 && (
                        <hr className="border-t-[0.4px] border-(--skools-border-subtle) w-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Section>

        <Section title="Discipline" count={discipline.data?.length ?? 0}>
          {discipline.isPending ? (
            <ListSkeleton label="Chargement des fiches" rows={2} />
          ) : (discipline.data ?? []).length === 0 ? (
            <EmptyState title="Rien à signaler" description="Aucune fiche disciplinaire pour cet élève." />
          ) : (
            <div className="flex flex-col">
              {(discipline.data ?? []).map((row, idx, arr) => {
                const meta = DISCIPLINE_PILL[row.status];
                return (
                  <div key={row.id} className="flex flex-col">
                    <Row
                      primary={row.title}
                      secondary={formatDateFr(row.incidentDate)}
                      right={<StatusPill label={meta.label} variant={meta.variant} />}
                    />
                    {idx < arr.length - 1 && (
                      <hr className="border-t-[0.4px] border-(--skools-border-subtle) w-full" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
