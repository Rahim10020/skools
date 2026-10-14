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
