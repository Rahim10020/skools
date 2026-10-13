import { ChevronBackIcon } from "../icons/ChevronBackIcon";
import { ChevronForwardIcon } from "../icons/ChevronForwardIcon";
import { Button } from "./button";

type PaginationProps = {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, hasNext, hasPrevious, onPageChange }: PaginationProps) {
  return (
    <div className="w-max flex items-center justify-center gap-p3 pt-p4">
      <Button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevious}
        fullWidth={false}
        aria-label="Page précédente"
        className="size-8! p-0! rounded-full!"
        icon={<ChevronBackIcon className="size-4" />}
      >
        {null}
      </Button>

      <span className="text-r14 text-(--skools-text-muted) min-w-max" aria-live="polite">
        {page} / {totalPages}
      </span>

      <Button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        fullWidth={false}
        aria-label="Page suivante"
        className="size-8! p-0! rounded-full!"
        icon={<ChevronForwardIcon className="size-4" />}
      >
        {null}
      </Button>
    </div>
  );
}
