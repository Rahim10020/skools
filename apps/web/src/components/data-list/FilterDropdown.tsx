import { useEffect, useRef, useState } from "react";
import { ChevronDownwardIcon } from "../icons/ChevronDownwardIcon";
import { cx } from "../../lib/cx";

export interface FilterOption {
  label: string;
  value: string;
}

/**
 * Filtre texte compact (bouton + menu déroulant) :
 * bouton texte `text-r12 muted`, valeur active entre parenthèses,
 * menu flottant avec item actif surligné + entrée « Tous » (reset).
 */
export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  allLabel = "Tous",
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (next: string) => () => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cx(
          "group flex gap-p2 items-center text-r14 text-(--skools-text-muted) hover:text-(--skools-text-primary) transition-all min-w-max cursor-pointer",
          active && "text-(--skools-text-primary)",
        )}
      >
        <span>
          {label} {active && `(${active.label})`}
        </span>
        <ChevronDownwardIcon
          className={cx("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute top-full left-0 z-50 mt-2 min-w-max bg-(--skools-app-bg) border border-(--skools-border-subtle) rounded-r2 shadow-lg p-1 flex flex-col gap-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={pick("")}
            className={cx(
              "block w-full text-left px-p4 py-2 text-r12 rounded-r2 transition-colors cursor-pointer",
              !active
                ? "bg-(--skools-interactive-active-bg) text-(--skools-text-primary) font-medium"
                : "text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) hover:text-(--skools-text-primary)",
            )}
          >
            {allLabel}
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitem"
              onClick={pick(option.value)}
              className={cx(
                "block w-full text-left px-p4 py-2 text-r12 rounded-r2 transition-colors cursor-pointer",
                value === option.value
                  ? "bg-(--skools-interactive-active-bg) text-(--skools-text-primary) font-medium"
                  : "text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) hover:text-(--skools-text-primary)",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
