import { useEffect, useRef, useState } from "react";
import type { AcademicYearRef } from "../types/api";
import { ROLES } from "../lib/roles";
import { API } from "../lib/api-endpoints";
import { KEYS } from "../lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuthStore } from "../stores/auth-store";
import { useAcademicYearStore } from "../stores/academic-year-store";
import { cx } from "../lib/cx";
import { ChevronDownwardIcon } from "./icons/ChevronDownwardIcon";

function yearLabel(year: AcademicYearRef) {
  return `${year.name}${year.isCurrent ? " (En cours)" : ""}`;
}

/**
 * Sélecteur d'année scolaire active (matrice, règles header 2/6).
 * bouton texte léger + dropdown, sans Select générique, sans recherche.
 * Masqué : replié, sans établissement, SUPER_ADMIN.
 */
export function ActiveYearSelector({ collapsed }: { collapsed: boolean }) {
  const establishmentId = useAuthStore((s) => s.establishmentId);
  const role = useAuthStore((s) => s.role);
  const storedEstablishmentId = useAcademicYearStore((s) => s.establishmentId);
  const activeYearId = useAcademicYearStore((s) => s.activeYearId);
  const setActiveYear = useAcademicYearStore((s) => s.setActiveYear);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const yearsQuery = useQuery({
    queryKey: KEYS.academicYears,
    queryFn: async () =>
      (await api.get<AcademicYearRef[]>(API.academicYears)).data,
    enabled: !!establishmentId && role !== ROLES.SUPER_ADMIN,
  });

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!establishmentId || role === ROLES.SUPER_ADMIN || collapsed) return null;

  const years = yearsQuery.data ?? [];
  const effectiveYear =
    storedEstablishmentId === establishmentId && activeYearId
      ? (years.find((year) => year.id === activeYearId) ??
        years.find((year) => year.isCurrent) ??
        years[0])
      : (years.find((year) => year.isCurrent) ?? years[0]);
  const effectiveYearId = effectiveYear?.id ?? "";

  const handleSelect = (id: string) => {
    setActiveYear(establishmentId, id);
    setOpen(false);
  };

  return (
    <div className="px-p4 pb-p3">
      <span className="text-m12 text-(--skools-text-primary)">
        Année scolaire
      </span>
      <div ref={containerRef} className="relative mt-p1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={yearsQuery.isLoading || years.length === 0}
          className={cx(
            "group flex w-full h-8 gap-p2 items-center justify-between px-p2 rounded-r2 text-m12 transition-colors cursor-pointer",
            "text-(--skools-text-muted) hover:text-(--skools-text-primary) hover:bg-(--skools-interactive-hover-bg)",
            effectiveYearId && "text-(--skools-text-primary)",
            (yearsQuery.isLoading || years.length === 0) &&
              "opacity-50 cursor-not-allowed",
          )}
        >
          <span className="truncate">
            {yearsQuery.isLoading
              ? "Chargement…"
              : effectiveYear
                ? yearLabel(effectiveYear)
                : "Aucune année"}
          </span>
          <ChevronDownwardIcon
            className={cx(
              "size-3.5 shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        {open && years.length > 0 && (
          <div
            role="listbox"
            aria-label="Choisir l'année scolaire"
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-(--skools-sidebar-bg) border border-(--skools-border-subtle) rounded-r2 shadow-lg p-1 gap-1 flex flex-col"
          >
            {years.map((year) => {
              const selected = year.id === effectiveYearId;
              return (
                <button
                  key={year.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(year.id)}
                  className={cx(
                    "block w-full text-left px-p2 py-1.5 text-m12 rounded-r2 transition-colors cursor-pointer",
                    selected
                      ? "bg-(--skools-interactive-active-bg) text-(--skools-text-primary) font-medium"
                      : "text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) hover:text-(--skools-text-primary)",
                  )}
                >
                  {yearLabel(year)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
