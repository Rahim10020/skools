import type { StatusPillVariant } from "../components/data-list/StatusPill";

/**
 * Source unique des libellés de statuts + variantes de pastilles.
 * Les pages n'y définissent plus leurs propres maps (divergences garanties sinon).
 * Note : DisciplinePage garde sa map locale (pastilles Badge, système différent).
 */

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export const ATTENDANCE_STATUS_META: Record<
  AttendanceStatus,
  { label: string; selectClass: string }
> = {
  PRESENT: { label: "Présent", selectClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  ABSENT: { label: "Absent", selectClass: "bg-(--common-red)/10 text-(--common-red)" },
  LATE: { label: "Retard", selectClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  EXCUSED: { label: "Excusé", selectClass: "bg-(--common-blue)/10 text-(--common-blue)" },
};

export const ATTENDANCE_STATUSES = Object.keys(ATTENDANCE_STATUS_META) as AttendanceStatus[];

export const ATTENDANCE_PILL: Record<
  AttendanceStatus,
  { label: string; variant: StatusPillVariant }
> = {
  PRESENT: { label: "Présent", variant: "success" },
  ABSENT: { label: "Absent", variant: "destructive" },
  LATE: { label: "Retard", variant: "neutral" },
  EXCUSED: { label: "Excusé", variant: "default" },
};

export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

export const ENROLLMENT_PILL: Record<
  EnrollmentStatus,
  { label: string; variant: StatusPillVariant }
> = {
  PENDING: { label: "En attente", variant: "neutral" },
  APPROVED: { label: "Approuvée", variant: "success" },
  REJECTED: { label: "Rejetée", variant: "destructive" },
  WITHDRAWN: { label: "Retirée", variant: "neutral" },
};

export type DisciplineStatus = "PENDING" | "ACTIVE" | "RESOLVED" | "CANCELLED";

export const DISCIPLINE_PILL: Record<
  DisciplineStatus,
  { label: string; variant: StatusPillVariant }
> = {
  PENDING: { label: "En attente", variant: "neutral" },
  ACTIVE: { label: "En cours", variant: "default" },
  RESOLVED: { label: "Résolue", variant: "success" },
  CANCELLED: { label: "Annulée", variant: "neutral" },
};

export const EXAM_PUBLISHED_PILL = {
  published: { label: "Publié", variant: "success" as StatusPillVariant },
  draft: { label: "Brouillon", variant: "neutral" as StatusPillVariant },
};

export const PERIOD_CURRENT_PILL = {
  label: "En cours",
  variant: "success" as StatusPillVariant,
};

export interface RateBand {
  label: string;
  variant: StatusPillVariant;
}

/** Assiduité (taux de présence en %) : seuils 95 / 90 / 80. */
export function attendanceRateBand(rate: number): RateBand {
  if (rate >= 95) return { label: "Excellent", variant: "success" };
  if (rate >= 90) return { label: "Bien", variant: "default" };
  if (rate >= 80) return { label: "À surveiller", variant: "neutral" };
  return { label: "Critique", variant: "destructive" };
}

/** Moyenne générale sur 20 : seuils 16 / 14 / 10. */
export function averageBand(avg: number): RateBand {
  if (avg >= 16) return { label: "Excellent", variant: "success" };
  if (avg >= 14) return { label: "Bien", variant: "default" };
  if (avg >= 10) return { label: "Passable", variant: "neutral" };
  return { label: "Insuffisant", variant: "destructive" };
}

/** Lien parent ↔ élève (miroir de ParentRelation côté API). */
export type ParentRelation = "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER";

export const RELATION_LABELS: Record<ParentRelation, string> = {
  FATHER: "Père",
  MOTHER: "Mère",
  GUARDIAN: "Tuteur",
  OTHER: "Autre",
};
