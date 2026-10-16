import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Checkbox } from "../ui/checkbox";
import { HeaderSelect } from "../data-list/HeaderSelect";
import { StatusPill, type StatusPillSpec } from "./StatusPill";
import { cx } from "../../lib/cx";

export interface DataColumn<T> {
  header: string;
  render: (item: T) => ReactNode;
  /** Colonnes non primaires masquées sur mobile. */
  primary?: boolean;
  className?: string;
}

export interface DataSelection {
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Checkbox global d'en-tête. Absent = cellule d'en-tête vide (le global vit dans la ligne header). */
  header?: ReactNode;
}

/**
 * Liste sans carte : fond transparent,
 * hairlines entre les lignes, pastille statut à droite.
 * Hybride Gmail : checkbox fantôme en tête de ligne (hover/focus/sélection),
 * actions au hover sur desktop, menu `•••` sur mobile.
 */
export function DataList<T>({
  items,
  columns,
  idOf,
  nameOf,
  statusPill,
  selection,
  readOnly = false,
  onEdit,
  onDelete,
  hideActionsFor,
  rowTo,
  actionLabels,
}: {
  items: T[];
  columns: DataColumn<T>[];
  idOf: (item: T) => string;
  nameOf: (item: T) => string;
  statusPill?: (item: T) => StatusPillSpec | null;
  selection?: DataSelection | null;
  readOnly?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  /** Lignes sans actions (ex. son propre compte) : affiche « — ». */
  hideActionsFor?: (item: T) => boolean;
  /** Libellés des actions ligne (défaut Modifier / Supprimer). */
  actionLabels?: { edit?: string; remove?: string };
  /** Clic sur la cellule primaire → page détail (l'édition reste en modal). */
  rowTo?: (item: T) => string;
}) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const editLabel = actionLabels?.edit ?? "Modifier";
  const removeLabel = actionLabels?.remove ?? "Supprimer";
  const showActions = !readOnly && (onEdit || onDelete);
  const template = [
    selection ? "24px" : null,
    ...columns.map(() => "minmax(0,1fr)"),
    "max-content",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="w-full flex flex-col">
      <div
        role="row"
        className="grid items-center gap-p3 text-xs text-(--skools-text-muted) mb-p2"
        style={{ gridTemplateColumns: template }}
      >
        {selection && <span>{selection.header ?? null}</span>}
        {columns.map((column) => (
          <p
            key={column.header}
            className={cx(!column.primary && "hidden md:block")}
          >
            {column.header}
          </p>
        ))}
        <p className="text-end">
          <span className="sr-only">Statut et actions</span>
        </p>
      </div>

      {items.map((item, idx) => {
        const id = idOf(item);
        const name = nameOf(item);
        const checked = selection?.has(id) ?? false;
        const pill = statusPill?.(item) ?? null;
        const noActions = hideActionsFor?.(item) ?? false;
        return (
          <div key={id} className="flex flex-col">
            <div
              role="row"
              className={cx(
                "group grid items-center gap-p3 py-p3",
                checked && "bg-(--skools-interactive-active-bg)/40 rounded-r1",
              )}
              style={{ gridTemplateColumns: template }}
            >
              {selection && (
                <span
                  className={cx(
                    "transition-opacity",
                    checked
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onChange={() => selection.toggle(id)}
                    aria-label={`Sélectionner ${name}`}
                  />
                </span>
              )}
              {columns.map((column) => (
                <div
                  key={column.header}
                  role="cell"
                  className={cx(
                    "min-w-0 text-r14",
                    column.primary
                      ? "text-(--skools-text-primary) font-medium"
                      : "text-(--skools-text-muted) hidden md:block",
                    column.className,
                  )}
                >
                  {column.primary && rowTo ? (
                    <Link
                      to={rowTo(item)}
                      className="block truncate hover:underline cursor-pointer"
                    >
                      {column.render(item)}
                    </Link>
                  ) : (
                    <span className="block truncate">
                      {column.render(item)}
                    </span>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-end gap-p3 min-w-max">
                {pill && <StatusPill label={pill.label} variant={pill.variant} />}
                {showActions && !noActions && (
                  <span className="hidden lg:flex items-center gap-p3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    {onEdit && (
                      <button
                        type="button"
                        aria-label={`${editLabel} ${name}`}
                        onClick={() => onEdit(item)}
                        className="text-r12 font-medium text-(--common-blue) hover:underline cursor-pointer"
                      >
                        {editLabel}
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        aria-label={`${removeLabel} ${name}`}
                        onClick={() => onDelete(item)}
                        className="text-r12 font-medium text-(--common-red) hover:underline cursor-pointer"
                      >
                        {removeLabel}
                      </button>
                    )}
                  </span>
                )}
                {showActions && !noActions && (
                  <span className="relative lg:hidden">
                    <button
                      type="button"
                      aria-label={`Options pour ${name}`}
                      aria-haspopup="menu"
                      aria-expanded={menuOpenId === id}
                      onClick={() => setMenuOpenId((v) => (v === id ? null : id))}
                      className="inline-flex size-8 items-center justify-center rounded-r1 text-r14 text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) cursor-pointer"
                    >
                      •••
                    </button>
                    {menuOpenId === id && (
                      <span
                        role="menu"
                        className="absolute right-0 top-full z-30 mt-1 min-w-36 flex flex-col gap-1 rounded-r2 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) p-1 shadow-lg"
                      >
                        {onEdit && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuOpenId(null);
                              onEdit(item);
                            }}
                            className="block w-full rounded-r2 px-p2 py-1.5 text-left text-r12 text-(--common-blue) hover:bg-(--skools-interactive-hover-bg) cursor-pointer"
                          >
                            {editLabel}
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuOpenId(null);
                              onDelete(item);
                            }}
                            className="block w-full rounded-r2 px-p2 py-1.5 text-left text-r12 text-(--common-red) hover:bg-(--skools-interactive-hover-bg) cursor-pointer"
                          >
                            {removeLabel}
                          </button>
                        )}
                      </span>
                    )}
                  </span>
                )}
                {showActions && noActions && (
                  <span className="text-r12 text-(--skools-text-muted)">-</span>
                )}
              </div>
            </div>
            {idx < items.length - 1 && (
              <hr className="border-t-[0.4px] border-(--skools-border-subtle) w-full" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export { HeaderSelect };
