import type { ComponentProps } from "react";

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={[
        "rounded-r2 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg)",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={["flex items-center justify-between gap-p4", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: ComponentProps<"h3">) {
  return (
    <h3
      className={["text-sb16 text-(--skools-text-primary)", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
