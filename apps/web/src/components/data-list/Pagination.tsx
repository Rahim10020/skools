import { ChevronBackIcon } from "../icons/ChevronBackIcon";
import { ChevronForwardIcon } from "../icons/ChevronForwardIcon";
import { cx } from "../../lib/cx";

/**
 * Pagination : 2 boutons ronds + `page / total`.
 * Pagination cliente (le backend skools ne pagine pas).
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;
  const roundBtn =
    "size-8 cursor-pointer inline-flex items-center justify-center rounded-full border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) text-(--skools-text-muted) transition-colors hover:text-(--skools-text-primary) hover:bg-(--skools-interactive-hover-bg) disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

  return (
    <div className="w-max flex items-center justify-center gap-p3 pt-p4">
      <button
        type="button"
        aria-label="Page précédente"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevious}
        className={cx(roundBtn)}
      >
        <ChevronBackIcon className="size-4" />
      </button>
      <span
        aria-live="polite"
        className="text-r14 text-(--skools-text-muted) min-w-max"
      >
        {page} / {Math.max(totalPages, 1)}
      </span>
      <button
        type="button"
        aria-label="Page suivante"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        className={cx(roundBtn)}
      >
        <ChevronForwardIcon className="size-4" />
      </button>
    </div>
  );
}
