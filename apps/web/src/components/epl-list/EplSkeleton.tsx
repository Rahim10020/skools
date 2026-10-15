import { Skeleton } from "../ui/skeleton";

/**
 * Skeleton façon epl : barre d'en-tête + lignes hautes + placeholder
 * pagination — sur fond transparent, comme la liste.
 */
export function EplSkeleton({
  rows = 6,
  label,
}: {
  rows?: number;
  label: string;
}) {
  return (
    <div className="w-full flex flex-col items-center gap-p2" role="status" aria-label={label}>
      <Skeleton className="w-full h-[30px] mb-1" count={1} />
      <Skeleton className="w-full h-[60px]" count={rows} />
      <Skeleton className="w-40 mt-4 ml-auto h-[32px]" count={1} />
    </div>
  );
}
