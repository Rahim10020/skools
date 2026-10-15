import { cx } from "../../lib/cx";

export type StatusPillVariant =
  | "neutral"
  | "success"
  | "destructive"
  | "default";

const VARIANT_CLASSES: Record<StatusPillVariant, string> = {
  neutral: "bg-(--skools-interactive-hover-bg)",
  success: "bg-green-500/40 dark:bg-green-500/50",
  destructive: "bg-(--common-red)/40",
  default: "bg-(--common-blue)/40",
};

/**
 * Pastille statut compacte (xs, dernier élément de ligne).
 */
export function StatusPill({
  label,
  variant = "default",
}: {
  label: string;
  variant?: StatusPillVariant;
}) {
  return (
    <span
      className={cx(
        "inline-flex max-w-max items-center justify-center rounded-r2 px-p2 py-p1 text-r11 font-medium text-(--skools-text-primary) whitespace-nowrap",
        VARIANT_CLASSES[variant],
      )}
    >
      {label}
    </span>
  );
}

export interface StatusPillSpec {
  label: string;
  variant: StatusPillVariant;
}
