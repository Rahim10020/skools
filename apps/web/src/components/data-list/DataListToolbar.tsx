import { Button } from "../ui/button";
import { TrashIcon } from "../icons/TrashIcon";
import { DownloadIcon } from "../icons/DownloadIcon";

/**
 * Barre contextuelle façon Gmail : remplace le compteur quand
 * des lignes sont sélectionnées et expose les actions groupées.
 */
export function DataListToolbar({
  total,
  itemLabel,
  selectedCount,
  canDelete,
  canExport,
  bulkPending,
  onBulkDelete,
  onExport,
  onClear,
}: {
  total: number;
  itemLabel: string;
  selectedCount: number;
  canDelete: boolean;
  canExport: boolean;
  bulkPending: boolean;
  onBulkDelete: () => void;
  onExport: () => void;
  onClear: () => void;
}) {
  if (selectedCount === 0) {
    return (
      <p aria-live="polite" className="text-r12 text-(--skools-text-muted)">
        {total} {itemLabel}
        {total > 1 ? "s" : ""}
      </p>
    );
  }

  return (
    <div
      role="toolbar"
      aria-label={`${selectedCount} sélectionné(s)`}
      className="flex flex-wrap items-center gap-p2 rounded-r2 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) px-p3 py-p2"
    >
      <span className="text-r12 font-medium text-(--skools-text-primary)">
        {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
      </span>
      {canExport && (
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-p1 text-r12 font-medium text-(--skools-text-primary) hover:underline cursor-pointer"
        >
          <DownloadIcon className="size-4" />
          Exporter CSV
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={onBulkDelete}
          disabled={bulkPending}
          className="inline-flex items-center gap-p1 text-r12 font-medium text-(--common-red) hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <TrashIcon className="size-4" />
          {bulkPending ? "Suppression…" : "Supprimer"}
        </button>
      )}
      <Button variant="secondary" fullWidth={false} onClick={onClear}>
        Effacer
      </Button>
    </div>
  );
}
