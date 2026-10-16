import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowForwardIcon } from "../icons/ArrowForwardIcon";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "social"
  | "loading"
  | "tag";

export type ButtonProps = {
  variant?: ButtonVariant;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  iconPushed?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-(--common-black) text-(--common-white)",
    "hover:bg-(--primary)",
    "dark:bg-(--common-white) dark:text-(--common-black) dark:hover:bg-(--black-10)",
    "cursor-pointer",
  ].join(" "),
  secondary: [
    "bg-(--skools-elevated-bg) text-(--skools-text-primary)",
    "cursor-pointer",
  ].join(" "),
  outline: [
    "border border-(--skools-text-primary) bg-transparent text-(--skools-text-primary)",
    "cursor-pointer",
  ].join(" "),
  social: [
    "bg-(--skools-elevated-bg) text-(--skools-text-primary)",
    "cursor-pointer",
  ].join(" "),
  loading: [
    "bg-(--skools-elevated-bg) text-(--skools-text-primary)",
    "cursor-not-allowed",
  ].join(" "),
  tag: [
    "bg-(--skools-text-primary)/5 text-(--skools-text-primary)",
    "hover:bg-(--skools-text-primary)/10",
    "cursor-pointer",
  ].join(" "),
};

export function LoadingDots({ className }: { className?: string }): ReactNode {
  const dots = [0, 1, 2];

  return (
    <span className={["flex items-center gap-(--spacing-p2)", className].filter(Boolean).join(" ")}>
      {dots.map((dot) => (
        <span key={dot} className="flex size-[8px] items-center justify-center">
          <span
            data-slot="dot"
            className="size-full rounded-full bg-(--primary) animate-[dot-wave_900ms_ease-in-out_infinite]"
            style={{ animationDelay: `${dot * 180}ms` }}
          />
        </span>
      ))}
    </span>
  );
}

export function Button({
  variant = "primary",
  icon,
  iconPosition = "right",
  iconPushed = false,
  fullWidth = true,
  disabled = false,
  children,
  className,
  ...rest
}: ButtonProps) {
  const isLoading = variant === "loading";
  const isTag = variant === "tag";

  const displayClass = fullWidth ? "flex w-full" : "inline-flex";
  const paddingClass =
    icon || iconPushed
      ? "px-(--spacing-p4) pl-(--spacing-p5)"
      : "px-(--spacing-p5)";

  // Pill compact façon tag (nouveau/ajout) : forme propre, pas le socle plein.
  const baseClasses = isTag
    ? [
        displayClass,
        "relative",
        "max-w-[120px]",
        "px-p3 py-1.5",
        "items-center",
        "rounded-full",
        "gap-p1",
        "text-r12 tracking-wide",
        "select-none transition-colors duration-200",
        "group",
      ].join(" ")
    : [
        displayClass,
        "relative",
        "h-(--size-s10)",
        paddingClass,
        "flex items-center justify-center",
        "rounded-(--radius-r6)",
        "gap-(--spacing-p1)",
        "text-r14 leading-none",
        "select-none transition-colors duration-200",
        "group",
      ].join(" ");

  const disabledClasses =
    disabled && !isLoading
      ? "bg-(--skools-elevated-bg) text-(--black-30) dark:text-white/30 cursor-not-allowed"
      : variantClasses[variant];

  const mergedClass = [baseClasses, disabledClasses, className]
    .filter(Boolean)
    .join(" ");

  const iconPushedClasses = iconPushed
    ? iconPosition === "left"
      ? "absolute left-(--spacing-p4) top-1/2 -translate-y-1/2"
      : "absolute left-(--spacing-p4) opacity-0 group-hover:opacity-100 group-hover:animate-[arrow-slide-bounce_350ms_ease-out_forwards]"
    : "";

  const finalIcon =
    icon ?? (iconPushed ? <ArrowForwardIcon className="size-full" /> : null);

  const iconEl = finalIcon ? (
    <span
      className={[
        "flex items-center justify-center",
        isTag ? "size-4 shrink-0" : "size-(--size-s5)",
        iconPushedClasses,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {finalIcon}
    </span>
  ) : null;

  return (
    <button
      className={mergedClass}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? (
        <LoadingDots />
      ) : (
        <>
          {iconPosition === "left" && iconEl}
          {children && (
            <span className={isTag ? "truncate" : undefined}>{children}</span>
          )}
          {iconPosition === "right" && iconEl}
        </>
      )}
    </button>
  );
}
