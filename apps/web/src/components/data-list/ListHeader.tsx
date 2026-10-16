import { useEffect, useRef, useState, type ReactNode } from "react";
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
 * En-tête de page liste : grand titre + compteur à gauche, checkbox global,
 * filtres texte, recherche et bouton de création à droite — le tout sur
 * une ligne (wrap sur mobile). Quand des lignes sont sélectionnées, la zone
 * droite **bascule en actions groupées** (pas de barre ajoutée au-dessus).
 */
export function ListHeader({
  title,
  description,
  count,
  countLabel,
  filters = [],
  searchable = false,
  searchPlaceholder = "Rechercher…",
  onSearch,
  selection = null,
  selectAll,
  createButton,
  extra,
}: {
  title?: string;
  description?: string;
  count: number;
  countLabel: string;
  filters?: ListFilterDef[];
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Appelé avec la valeur debounced (400 ms). */
  onSearch?: (value: string) => void;
  selection?: BulkSelection | null;
  /** Checkbox global (Toutes / Aucune / Inverser), affiché en tête de zone droite. */
  selectAll?: ReactNode;
  /** Bouton de création (pill), affiché en fin de zone droite. */
  createButton?: ReactNode;
  extra?: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  // Ne propage que les changements réels : sans ce garde, un `onSearch`
  // recréé à chaque rendu refait tourner l'effet en boucle (setState ping-pong).
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    const value = debouncedSearch.trim();
    if (lastSent.current === value) return;
    lastSent.current = value;
    onSearch?.(value);
  }, [debouncedSearch, onSearch]);

  return (
    <div className="w-full flex items-start lg:items-center justify-between gap-p1 flex-wrap">
      <div className="min-w-0">
        {title && (
          <div className="flex gap-p4 items-center">
            <h1 className="font-semibold text-sb32 leading-9 text-(--skools-text-primary)">
              {title}
            </h1>
            <p
              aria-live="polite"
              className="text-r14 text-(--skools-text-muted) min-w-max"
            >
              {count} {countLabel}
            </p>
          </div>
        )}
        {!title && (
          <p aria-live="polite" className="text-r14 text-(--skools-text-muted)">
            {count} {countLabel}
          </p>
        )}
        {description && (
          <p className="text-r14 text-(--skools-text-muted) mt-p2">
            {description}
          </p>
        )}
      </div>
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
              Annuler
            </button>
          </div>
        ) : (
          <>
            {selectAll}
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
                className="px-3 py-1.5 text-xs border border-(--search-border) rounded-r2 bg-transparent text-(--skools-text-primary) placeholder:text-(--skools-text-muted) focus:outline-none focus:ring-2 focus:ring-(--skools-interactive-active-bg)"
              />
            )}
            {extra}
            {createButton}
          </>
        )}
      </div>
    </div>
  );
}
