import type { IdName } from "../../types/api";
import { ROLES } from "../../lib/roles";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { CrudPage } from "../../components/crud/CrudPage";
import { useAuthStore } from "../../stores/auth-store";
import type { StatusPillVariant } from "../../components/epl-list/StatusPill";
import api from "../../lib/api";
import {
  formatDateFr,
  omitEmptyStrings,
  optionalNumberString,
  toDateInput,
  toOptionalNumber,
} from "../../components/crud/crud-helpers";

type ExamType = "INTERROGATION" | "DEVOIR" | "COMPOSITION" | "EXAMEN" | "AUTRE";

interface Exam {
  id: string;
  name: string;
  academicYearId: string;
  subjectId: string;
  periodId: string | null;
  classroomId: string | null;
  type: ExamType;
  examDate: string | null;
  maxScore: number;
  coefficient: number;
  isPublished: boolean;
  subject: { id: string; name: string };
  classroom: { id: string; name: string } | null;
}

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  INTERROGATION: "Interrogation",
  DEVOIR: "Devoir",
  COMPOSITION: "Composition",
  EXAMEN: "Examen",
  AUTRE: "Autre",
};

const schema = z.object({
  name: z.string().min(2, "Nom requis"),
  academicYearId: z.string().min(1, "Année scolaire requise"),
  subjectId: z.string().min(1, "Matière requise"),
  periodId: z.string().optional(),
  classroomId: z.string().optional(),
  type: z.enum(["INTERROGATION", "DEVOIR", "COMPOSITION", "EXAMEN", "AUTRE"]),
  examDate: z.string().optional(),
  maxScore: optionalNumberString(),
  coefficient: optionalNumberString(),
  isPublished: z.enum(["true", "false"]).optional(),
});

export default function ExamsPage() {
  const role = useAuthStore((state) => state.role);
  // Seul DIRECTOR crée des examens ; CENSEUR supervise, TEACHER consulte (matrice).
  const canWrite = role === ROLES.DIRECTOR;
  const yearsQuery = useQuery({
    queryKey: KEYS.academicYears,
    queryFn: async () => (await api.get<IdName[]>(API.academicYears)).data,
  });
  const subjectsQuery = useQuery({
    queryKey: KEYS.subjects,
    queryFn: async () => (await api.get<IdName[]>(API.subjects)).data,
    // Référentiels inaccessibles à TEACHER (formulaire masqué en lecture seule).
    enabled: role !== ROLES.TEACHER,
  });
  const periodsQuery = useQuery({
    queryKey: KEYS.periods,
    queryFn: async () => (await api.get<IdName[]>(API.periods)).data,
    enabled: role !== ROLES.TEACHER,
  });
  const classroomsQuery = useQuery({
    queryKey: KEYS.classrooms,
    queryFn: async () => (await api.get<IdName[]>(API.classrooms)).data,
    enabled: role !== ROLES.TEACHER,
  });

  const toOptions = (data: IdName[] | undefined) =>
    (data ?? []).map((item) => ({ label: item.name, value: item.id }));

  return (
    <CrudPage<Exam>
      title="Examens"
      description="Les évaluations : interrogations, devoirs, compositions et examens."
      readOnly={!canWrite}
      itemLabel="examen"
      createLabel="Nouvel examen"
      queryKey={KEYS.exams}
      endpoint={API.exams}
      pageSize={10}
      searchPlaceholder="Rechercher un examen…"
      filters={[
        {
          key: "subject",
          label: "Matière",
          param: "subjectId",
          options: toOptions(subjectsQuery.data),
        },
        {
          key: "classroom",
          label: "Classe",
          param: "classroomId",
          options: toOptions(classroomsQuery.data),
        },
        {
          key: "period",
          label: "Période",
          param: "periodId",
          options: toOptions(periodsQuery.data),
        },
      ]}
      statusPill={(exam) =>
        exam.isPublished
          ? { label: "Publié", variant: "success" as StatusPillVariant }
          : { label: "Brouillon", variant: "neutral" as StatusPillVariant }
      }
      columns={[
        { header: "Examen", primary: true, render: (exam) => exam.name },
        { header: "Matière", render: (exam) => exam.subject.name },
        {
          header: "Classe",
          render: (exam) => exam.classroom?.name ?? "Toutes",
        },
        {
          header: "Type",
          render: (exam) => EXAM_TYPE_LABELS[exam.type],
        },
        { header: "Date", render: (exam) => formatDateFr(exam.examDate) },
      ]}
      fields={[
        {
          name: "name",
          label: "Nom",
          type: "text",
          placeholder: "Ex : Devoir n°1",
          required: true,
        },
        {
          name: "academicYearId",
          label: "Année scolaire",
          type: "select",
          required: true,
          options: toOptions(yearsQuery.data),
        },
        {
          name: "subjectId",
          label: "Matière",
          type: "select",
          required: true,
          options: toOptions(subjectsQuery.data),
        },
        {
          name: "periodId",
          label: "Période (optionnel)",
          type: "select",
          options: toOptions(periodsQuery.data),
        },
        {
          name: "classroomId",
          label: "Classe (optionnel, vide = toutes)",
          type: "select",
          options: toOptions(classroomsQuery.data),
        },
        {
          name: "type",
          label: "Type",
          type: "select",
          required: true,
          disableSelectSearch: true,
          options: (
            Object.entries(EXAM_TYPE_LABELS) as Array<[ExamType, string]>
          ).map(([value, label]) => ({ label, value })),
        },
        { name: "examDate", label: "Date (optionnel)", type: "date" },
        {
          name: "maxScore",
          label: "Note maximale",
          type: "number",
          placeholder: "20",
        },
        {
          name: "coefficient",
          label: "Coefficient",
          type: "number",
          placeholder: "1",
        },
        { name: "isPublished", label: "Publié (visible)", type: "checkbox" },
      ]}
      schema={schema}
      toDefaults={(exam) => ({
        name: exam?.name ?? "",
        academicYearId: exam?.academicYearId ?? "",
        subjectId: exam?.subjectId ?? "",
        periodId: exam?.periodId ?? "",
        classroomId: exam?.classroomId ?? "",
        type: exam?.type ?? "DEVOIR",
        examDate: toDateInput(exam?.examDate),
        maxScore: exam ? String(exam.maxScore) : "20",
        coefficient: exam ? String(exam.coefficient) : "1",
        isPublished: exam ? String(exam.isPublished) : "false",
      })}
      toSubmit={(values) =>
        omitEmptyStrings({
          name: values.name,
          academicYearId: values.academicYearId,
          subjectId: values.subjectId,
          periodId: values.periodId === "" ? undefined : values.periodId,
          classroomId:
            values.classroomId === "" ? undefined : values.classroomId,
          type: values.type,
          examDate: values.examDate === "" ? undefined : values.examDate,
          maxScore: toOptionalNumber(values.maxScore),
          coefficient: toOptionalNumber(values.coefficient),
          isPublished: values.isPublished === "true",
        })
      }
      nameOf={(exam) => exam.name}
    />
  );
}
