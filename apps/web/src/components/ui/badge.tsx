import type { ComponentProps } from "react";

const badgeStyles = {
  default: "bg-(--common-blue)/10 text-(--common-blue)",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  destructive: "bg-(--common-red)/10 text-(--common-red)",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  ghost: "bg-transparent text-(--skools-text-muted)",
  neutral: "bg-(--skools-elevated-bg) text-(--skools-text-primary)",
} as const;

export type BadgeVariant = keyof typeof badgeStyles;

type BadgeProps = ComponentProps<"span"> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full px-p3 py-1.5 text-[11px] font-medium whitespace-nowrap",
        badgeStyles[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
