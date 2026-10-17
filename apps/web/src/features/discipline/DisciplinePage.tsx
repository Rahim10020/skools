import type { StudentRow } from "../../types/api";
import { ROLES } from "../../lib/roles";
import { API, apiPath } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { CrudPage } from "../../components/crud/CrudPage";
import { Badge, type BadgeVariant } from "../../components/ui/badge";
import { DISCIPLINE_PILL } from "../../lib/status-meta";
import { PageHeader } from "../../layouts/PageHeader";
import { EmptyState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";
import api from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import { ChildSelector } from "../../components/ChildSelector";
import { useEffectiveChildId, useMyChildren } from "../../lib/my-children";
import {
  formatDateFr,
  omitEmptyStrings,
  toDateInput,
} from "../../components/crud/crud-helpers";

type DisciplineType =
  | "WARNING"
  | "REPRIMAND"
  | "DETENTION"
  | "SUSPENSION"
  | "EXPULSION"
  | "OBSERVATION"
  | "OTHER";

type DisciplineStatus = "PENDING" | "ACTIVE" | "RESOLVED" | "CANCELLED";

interface DisciplineRecord {
  id: string;
  studentId: string;
  type: DisciplineType;
  status: DisciplineStatus;
  title: string;
  description: string | null;
  incidentDate: string;
  resolution: string | null;
  resolvedAt: string | null;
  student: StudentRow;
}

const TYPE_LABELS: Record<DisciplineType, string> = {
  OBSERVATION: "Observation",
  WARNING: "Avertissement",
  REPRIMAND: "Blâme",
  DETENTION: "Retenue",
  SUSPENSION: "Exclusion temporaire",
  EXPULSION: "Exclusion définitive",
  OTHER: "Autre",
};

const TYPE_OPTIONS: Array<{ label: string; value: DisciplineType }> = (
  Object.entries(TYPE_LABELS) as Array<[DisciplineType, string]>
).map(([value, label]) => ({ label, value }));

const STATUS_META: Record<
  DisciplineStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: "En attente", variant: "warning" },
  ACTIVE: { label: "En cours", variant: "default" },
  RESOLVED: { label: "Résolue", variant: "success" },
  CANCELLED: { label: "Annulée", variant: "neutral" },
};

const STATUS_OPTIONS = (
  Object.entries(STATUS_META) as Array<
    [DisciplineStatus, (typeof STATUS_META)[DisciplineStatus]]
  >
).map(([value, meta]) => ({ label: meta.label, value }));

const schema = z.object({
  studentId: z.string().min(1, "Élève requis"),
  type: z.enum([
    "WARNING",
    "REPRIMAND",
    "DETENTION",
    "SUSPENSION",
    "EXPULSION",
    "OBSERVATION",
    "OTHER",
  ]),
  title: z.string().min(3, "Titre requis (3 caractères minimum)"),
  description: z.string().optional(),
  incidentDate: z.string().min(1, "Date de l'incident requise"),
  status: z.enum(["PENDING", "ACTIVE", "RESOLVED", "CANCELLED"]).optional(),
  resolution: z.string().optional(),
  resolvedAt: z.string().optional(),
});

export default function DisciplinePage() {
  const role = useAuthStore((state) => state.role);
  const isParent = role === ROLES.PARENT;
  const isStudent = role === ROLES.STUDENT;
  const isFamily = isParent || isStudent;
  const childId = useEffectiveChildId(isParent);
  const childrenQuery = useMyChildren(isParent);

  const studentsQuery = useQuery({
    queryKey: KEYS.students,
    queryFn: async () => (await api.get<StudentRow[]>(API.students)).data,
    // Famille : pas d'accès à la liste globale (matrice).
    enabled: !isFamily,
  });

  const meQuery = useQuery({
    queryKey: KEYS.studentsMe,
    queryFn: async () => (await api.get<{ id: string }>(API.studentsMe)).data,
    enabled: isStudent,
  });

  const familyStudentId = isParent ? childId : (meQuery.data?.id ?? "");
  const familyLoading = isParent ? childrenQuery.isPending : meQuery.isPending;

  if (isFamily && familyLoading) {
    return (
      <div>
        <PageHeader
          title={isStudent ? "Ma discipline" : "Discipline"}
          description="Les fiches disciplinaires : signalements et suivi."
        />
        <Skeleton className="h-[200px] rounded-r2" />
      </div>
    );
  }

  if (isFamily && !familyLoading && !familyStudentId) {
    return (
      <div>
        <PageHeader
          title={isStudent ? "Ma discipline" : "Discipline"}
          description="Les fiches disciplinaires : signalements et suivi."
        />
        {isParent && <ChildSelector />}
        <EmptyState
          title={isParent ? "Aucun enfant lié" : "Aucun dossier élève"}
          description="Contactez la direction de l'établissement."
        />
      </div>
    );
  }

  const baseFields = [
    {
      name: "studentId",
      label: "Élève",
      type: "select" as const,
      required: true,
      options: (studentsQuery.data ?? []).map((student) => ({
        label: `${student.lastName} ${student.firstName}${student.matricule ? ` (${student.matricule})` : ""}`,
        value: student.id,
      })),
    },
    {
      name: "type",
      label: "Type de sanction",
      type: "select" as const,
      required: true,
      disableSelectSearch: true,
      options: TYPE_OPTIONS.map((option) => ({
        label: option.label,
        value: option.value as string,
      })),
    },
    {
      name: "title",
      label: "Titre",
      type: "text" as const,
      placeholder: "Ex : Retard répété en cours",
      required: true,
    },
    {
      name: "incidentDate",
      label: "Date de l'incident",
      type: "date" as const,
      required: true,
    },
    { name: "description", label: "Description", type: "textarea" as const },
  ];

  return (
    <CrudPage<DisciplineRecord>
      title={isStudent ? "Ma discipline" : "Discipline"}
      description={
        isFamily
          ? "Les fiches disciplinaires : signalements et suivi."
          : "Les fiches disciplinaires : signalement, suivi et résolution."
      }
      readOnly={isFamily}
      itemLabel="fiche disciplinaire"
      pluralLabel="fiches disciplinaires"
      createLabel="Nouvelle fiche"
      queryKey={isFamily ? KEYS.discipline(familyStudentId) : KEYS.discipline()}
      endpoint={API.discipline}
      listPath={
        isFamily ? apiPath.disciplineByStudent(familyStudentId) : undefined
      }
      toolbarExtra={isParent ? <ChildSelector /> : undefined}
      searchPlaceholder="Rechercher une fiche…"
      filters={[
        { key: "status", label: "Statut", param: "status", options: STATUS_OPTIONS },
        {
          key: "type",
          label: "Type",
          param: "type",
          options: TYPE_OPTIONS.map((option) => ({
            label: option.label,
            value: option.value as string,
          })),
        },
      ]}
      statusPill={(record) => DISCIPLINE_PILL[record.status]}
      csvFilename={isFamily ? undefined : "discipline"}
      csvHeaders={
        isFamily
          ? undefined
          : ["Élève", "Fiche", "Type", "Incident le", "Statut"]
      }
      toCsvRow={
        isFamily
          ? undefined
          : (record) => [
              `${record.student.lastName} ${record.student.firstName}`,
              record.title,
              TYPE_LABELS[record.type],
              formatDateFr(record.incidentDate),
              STATUS_META[record.status].label,
            ]
      }
      columns={[
        {
          header: "Élève",
          primary: true,
          render: (record) =>
            `${record.student.lastName} ${record.student.firstName}`,
        },
        { header: "Fiche", render: (record) => record.title },
        {
          header: "Type",
          render: (record) => (
            <Badge variant="neutral">{TYPE_LABELS[record.type]}</Badge>
          ),
        },
        {
          header: "Incident le",
          render: (record) => formatDateFr(record.incidentDate),
        },
      ]}
      fields={baseFields}
      editFields={[
        ...baseFields,
        {
          name: "status",
          label: "Statut",
          type: "select" as const,
          disableSelectSearch: true,
          options: STATUS_OPTIONS.map((option) => ({
            label: option.label,
            value: option.value as string,
          })),
        },
        { name: "resolution", label: "Résolution", type: "textarea" as const },
        {
          name: "resolvedAt",
          label: "Date de résolution",
          type: "date" as const,
        },
      ]}
      schema={schema}
      toDefaults={(record) => ({
        studentId: record?.studentId ?? "",
        type: record?.type ?? "OBSERVATION",
        title: record?.title ?? "",
        incidentDate: toDateInput(record?.incidentDate),
        description: record?.description ?? "",
        status: record?.status ?? "PENDING",
        resolution: record?.resolution ?? "",
        resolvedAt: toDateInput(record?.resolvedAt),
      })}
      toSubmit={(values, mode) =>
        omitEmptyStrings({
          studentId: values.studentId,
          type: values.type,
          title: values.title,
          incidentDate: values.incidentDate,
          description: values.description,
          // resolution / resolvedAt / status : PATCH uniquement (400 en création).
          ...(mode === "edit"
            ? {
                status: values.status,
                resolution: values.resolution,
                resolvedAt:
                  values.resolvedAt === "" ? undefined : values.resolvedAt,
              }
            : {}),
        })
      }
      nameOf={(record) =>
        `${record.title} — ${record.student.lastName} ${record.student.firstName}`
      }
    />
  );
}
