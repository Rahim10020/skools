import type { ComponentProps, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function TableContainer({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={[
        "rounded-r2 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}

export function Table({ className, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table
        className={["min-w-full divide-y divide-(--skools-border-subtle)", className].filter(Boolean).join(" ")}
        {...rest}
      />
    </div>
  );
}

export function TableHeader({ className, ...rest }: ComponentProps<"thead">) {
  return <thead className={className} {...rest} />;
}

export function TableHeaderCell({ className, scope = "col", ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope={scope}
      className={[
        "px-p6 py-3 text-left text-r12 font-medium text-(--skools-text-muted)",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}

export function TableBody({ className, ...rest }: ComponentProps<"tbody">) {
  return (
    <tbody className={["divide-y divide-(--skools-border-subtle)", className].filter(Boolean).join(" ")} {...rest} />
  );
}

export function TableRow({ className, ...rest }: ComponentProps<"tr">) {
  return <tr className={["hover:bg-(--skools-interactive-hover-bg) transition-colors", className].filter(Boolean).join(" ")} {...rest} />;
}

export function TableCell({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={["px-p6 py-4 text-r14 text-(--skools-text-muted)", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}

export function TableCellPrimary({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={["px-p6 py-4 text-r14 font-medium text-(--skools-text-primary)", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
