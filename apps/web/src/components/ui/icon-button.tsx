import type { ComponentProps } from "react";

type IconButtonProps = ComponentProps<"button">;

export function IconButton({ children, className, ...rest }: IconButtonProps) {
  return (
    <button
      className={[
        "border-none outline-none size-8 cursor-pointer flex items-center justify-center transition-all duration-300 rounded-r1 text-(--skools-icon-muted) hover:bg-(--skools-elevated-bg) hover:text-(--skools-icon-primary)",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
