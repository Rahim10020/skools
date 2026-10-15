import { useEffect, useRef, useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { ChevronDownwardIcon } from "../icons/ChevronDownwardIcon";
import { cx } from "../../lib/cx";

/**
 * Checkbox d'en-tête façon Gmail + menu filtre façon epl `All applications`
 * (sex / series) : Toutes / Aucune / Inverser la sélection (page visible).
 */
export function HeaderSelect({
  checked,
  indeterminate,
  onToggleAll,
  onSelectAll,
  onSelectNone,
  onInvert,
  label = "Sélectionner les lignes",
}: {
  checked: boolean;
  indeterminate: boolean;
  onToggleAll: () => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onInvert: () => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const pick = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-p1">
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        onChange={onToggleAll}
        aria-label={label}
      />
      <button
        type="button"
        aria-label="Options de sélection"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center size-5 rounded-r1 text-(--skools-text-muted) hover:text-(--skools-text-primary) hover:bg-(--skools-interactive-hover-bg) transition-colors cursor-pointer"
      >
        <ChevronDownwardIcon
          className={cx("size-3 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Filtres de sélection"
          className="absolute top-full left-0 z-50 mt-1 min-w-36 bg-(--skools-sidebar-bg) border border-(--skools-border-subtle) rounded-r2 shadow-lg p-1 flex flex-col gap-1"
        >
          {(
            [
              { label: "Toutes", fn: onSelectAll },
              { label: "Aucune", fn: onSelectNone },
              { label: "Inverser la sélection", fn: onInvert },
            ] as const
          ).map((option) => (
            <button
              key={option.label}
              type="button"
              role="menuitem"
              onClick={pick(option.fn)}
              className="block w-full text-left px-p2 py-1.5 text-r12 text-(--skools-text-primary) hover:bg-(--skools-interactive-hover-bg) rounded-r2 transition-colors cursor-pointer"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
