import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "../ui/table";
import { Skeleton } from "../ui/skeleton";

/**
 * Skeleton de liste : toolbar (checkbox + actions) + lignes avec
 * colonne checkbox, pour rester cohérent avec la table sélectionnable.
 */
export function DataListSkeleton({
  columns,
  rows = 5,
  label,
}: {
  columns: number;
  rows?: number;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-p3">
      <div className="flex items-center gap-p3">
        <Skeleton className="size-[16px] rounded-r1" />
        <Skeleton className="h-[16px] w-24 rounded-r1" />
        <Skeleton className="h-[16px] w-20 rounded-r1" />
      </div>
      <TableContainer>
        <Table aria-label={label}>
          <TableBody>
            {Array.from({ length: rows }, (_, row) => (
              <TableRow key={row}>
                <TableCell className="w-10">
                  <Skeleton className="size-[16px] rounded-r1" />
                </TableCell>
                {Array.from({ length: columns }, (_, col) => (
                  <TableCell key={col}>
                    <Skeleton className="h-[16px] w-3/4 rounded-r1" />
                  </TableCell>
                ))}
                <TableCell>
                  <Skeleton className="h-[16px] w-16 rounded-r1 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
