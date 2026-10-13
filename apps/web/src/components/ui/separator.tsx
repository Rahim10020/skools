import type { ComponentProps } from "react";

export function Separator({ className, ...restProps }: ComponentProps<"hr">) {
  return (
    <hr
      className={["border-t-[0.4px] border-(--skools-border-subtle) w-full", className]
        .filter(Boolean)
        .join(" ")}
      {...restProps}
    />
  );
}
