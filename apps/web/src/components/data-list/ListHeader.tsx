import { useEffect, useState, type ReactNode } from "react";
import { FilterDropdown, type FilterOption } from "./FilterDropdown";
import { DownloadIcon } from "../icons/DownloadIcon";
import { TrashIcon } from "../icons/TrashIcon";

export interface ListFilterDef {
  key: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export interface BulkSelection {
  count: number;
  canDelete: boolean;
  canExport: boolean;
  pending: boolean;
  onDelete: () => void;
  onExport: () => void;
  onClear: () => void;
}

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/**
 * Ligne d'en-tête : compteur à gauche, filtres texte + petite
 * recherche à droite. Quand des lignes sont sélectionnées, la zone droite
 * **bascule en actions groupées** (pas de barre ajoutée au-dessus).
 */
export function ListHeader({
  count,
  countLabel,
  filters = [],
  searchable = false,
  searchPlaceholder = "Rechercher…",
  onSearch,
  selection = null,
  extra,
}: {
  count: number;
  countLabel: string;
  filters?: ListFilterDef[];
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Appelé avec la valeur debounced (400 ms). */
  onSearch?: (value: string) => void;
  selection?: BulkSelection | null;
  extra?: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    onSearch?.(debouncedSearch.trim());
  }, [debouncedSearch, onSearch]);

  return (
    <div className="w-full flex items-start lg:items-center justify-between gap-p1 flex-wrap">
      <p aria-live="polite" className="text-r14 text-(--skools-text-muted)">
        {count} {countLabel}
        {count > 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-p5 flex-wrap justify-end">
        {selection && selection.count > 0 ? (
          <div
            role="toolbar"
            aria-label={`${selection.count} sélectionné(s)`}
            className="flex items-center gap-p5 flex-wrap justify-end"
          >
            <span className="text-r12 font-medium text-(--skools-text-primary)">
              {selection.count} sélectionné{selection.count > 1 ? "s" : ""}
            </span>
            {selection.canExport && (
              <button
                type="button"
                onClick={selection.onExport}
                className="inline-flex items-center gap-p2 text-[12px] text-(--skools-text-muted) hover:text-(--skools-text-primary) transition-all cursor-pointer"
              >
                <DownloadIcon className="size-3.5" />
                Exporter CSV
              </button>
            )}
            {selection.canDelete && (
              <button
                type="button"
                onClick={selection.onDelete}
                disabled={selection.pending}
                className="inline-flex items-center gap-p2 text-[12px] text-(--common-red) hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <TrashIcon className="size-3.5" />
                {selection.pending ? "Suppression…" : "Supprimer"}
              </button>
            )}
            <button
              type="button"
              onClick={selection.onClear}
              className="text-[12px] text-(--skools-text-muted) hover:text-(--skools-text-primary) transition-all cursor-pointer"
            >
              Effacer
            </button>
          </div>
        ) : (
          <>
            {filters.map((filter) => (
              <FilterDropdown
                key={filter.key}
                label={filter.label}
                value={filter.value}
                options={filter.options}
                onChange={filter.onChange}
              />
            ))}
            {searchable && (
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="px-3 py-1.5 text-xs border border-(--skools-border-subtle) rounded-r2 bg-(--skools-sidebar-bg) text-(--skools-text-primary) placeholder:text-(--skools-text-muted) focus:outline-none focus:ring-2 focus:ring-(--skools-interactive-active-bg)"
              />
            )}
            {extra}
          </>
        )}
      </div>
    </div>
  );
}
