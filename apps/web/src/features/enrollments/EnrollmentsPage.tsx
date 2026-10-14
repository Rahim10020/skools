import type { IdName, StudentRow } from "../../types/api";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { CrudPage } from "../../components/crud/CrudPage";
import { Badge, type BadgeVariant } from "../../components/ui/badge";
import api from "../../lib/api";
import { omitEmptyStrings } from "../../components/crud/crud-helpers";

type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

interface Enrollment {
  id: string;
  studentId: string;
  classroomId: string;
  academicYearId: string;
  status: EnrollmentStatus;
  notes: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string | null;
  };
  classroom: { id: string; name: string };
  academicYear: { id: string; name: string };
}

const STATUS_META: Record<
  EnrollmentStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: "En attente", variant: "warning" },
  APPROVED: { label: "Approuvée", variant: "success" },
  REJECTED: { label: "Rejetée", variant: "destructive" },
  WITHDRAWN: { label: "Retirée", variant: "neutral" },
};

const schema = z.object({
  studentId: z.string().min(1, "Élève requis"),
  classroomId: z.string().min(1, "Classe requise"),
  academicYearId: z.string().min(1, "Année scolaire requise"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"]),
  notes: z.string().optional(),
});

export default function EnrollmentsPage() {
  const studentsQuery = useQuery({
    queryKey: KEYS.students,
    queryFn: async () => (await api.get<StudentRow[]>(API.students)).data,
  });
  const classroomsQuery = useQuery({
    queryKey: KEYS.classrooms,
    queryFn: async () => (await api.get<IdName[]>(API.classrooms)).data,
  });
  const yearsQuery = useQuery({
    queryKey: KEYS.academicYears,
    queryFn: async () => (await api.get<IdName[]>(API.academicYears)).data,
  });

  return (
    <CrudPage<Enrollment>
      title="Inscriptions"
      description="L'affectation des élèves aux classes pour chaque année scolaire."
      itemLabel="inscription"
      createLabel="Nouvelle inscription"
      queryKey={KEYS.enrollments}
      endpoint={API.enrollments}
      columns={[
        {
          header: "Élève",
          primary: true,
          render: (enrollment) =>
            `${enrollment.student.lastName} ${enrollment.student.firstName}`,
        },
        { header: "Classe", render: (enrollment) => enrollment.classroom.name },
        {
          header: "Année scolaire",
          render: (enrollment) => enrollment.academicYear.name,
        },
        {
          header: "Statut",
          render: (enrollment) => {
            const meta = STATUS_META[enrollment.status];
            return <Badge variant={meta.variant}>{meta.label}</Badge>;
          },
        },
        { header: "Notes", render: (enrollment) => enrollment.notes || "—" },
      ]}
      fields={[
        {
          name: "studentId",
          label: "Élève",
          type: "select",
          required: true,
          options: (studentsQuery.data ?? []).map((student) => ({
            label: `${student.lastName} ${student.firstName}${student.matricule ? ` (${student.matricule})` : ""}`,
            value: student.id,
          })),
        },
        {
          name: "classroomId",
          label: "Classe",
          type: "select",
          required: true,
          options: (classroomsQuery.data ?? []).map((classroom) => ({
            label: classroom.name,
            value: classroom.id,
          })),
        },
        {
          name: "academicYearId",
          label: "Année scolaire",
          type: "select",
          required: true,
          options: (yearsQuery.data ?? []).map((year) => ({
            label: year.name,
            value: year.id,
          })),
        },
        {
          name: "status",
          label: "Statut",
          type: "select",
          required: true,
          disableSelectSearch: true,
          options: (
            Object.entries(STATUS_META) as Array<
              [EnrollmentStatus, (typeof STATUS_META)[EnrollmentStatus]]
            >
          ).map(([value, meta]) => ({ label: meta.label, value })),
        },
        { name: "notes", label: "Notes internes", type: "textarea" },
      ]}
      schema={schema}
      toDefaults={(enrollment) => ({
        studentId: enrollment?.studentId ?? "",
        classroomId: enrollment?.classroomId ?? "",
        academicYearId: enrollment?.academicYearId ?? "",
        status: enrollment?.status ?? "PENDING",
        notes: enrollment?.notes ?? "",
      })}
      toSubmit={(values) =>
        omitEmptyStrings({
          studentId: values.studentId,
          classroomId: values.classroomId,
          academicYearId: values.academicYearId,
          status: values.status,
          notes: values.notes,
        })
      }
      nameOf={(enrollment) =>
        `${enrollment.student.lastName} ${enrollment.student.firstName} — ${enrollment.classroom.name}`
      }
    />
  );
}
