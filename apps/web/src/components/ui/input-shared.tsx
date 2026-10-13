import type { ReactNode } from "react";

export function IconBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center size-(--size-s5) text-(--black-30)",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export function RequiredDot() {
  return (
    <span className="absolute top-0 left-0 pointer-events-none flex size-[8px] items-center justify-center rounded-full bg-(--skools-sidebar-bg)">
      <span className="flex size-[6px] items-center justify-center rounded-full bg-(--common-red-50)">
        <span className="size-[4px] rounded-full bg-(--common-red)" />
      </span>
    </span>
  );
}

export function HelperText({ children }: { children: ReactNode }) {
  return (
    <span className="text-[12px] font-normal text-(--black-30) px-(--spacing-p1)">
      {children}
    </span>
  );
}
