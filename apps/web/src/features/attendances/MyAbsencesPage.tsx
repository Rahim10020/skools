import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import { ChildSelector } from "../../components/ChildSelector";
import {
  useEffectiveChildId,
  useMyChildren,
} from "../../lib/my-children";
import { formatDateFr } from "../../components/crud/crud-helpers";
import { PageHeader } from "../../layouts/PageHeader";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableCellPrimary,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "../../components/ui/table";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";
import {
  ATTENDANCE_STATUS_META,
  type AttendanceStatus,
} from "./status-meta";

interface AttendanceHistoryItem {
  id: string;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  classroom: { id: string; name: string };
}

interface MeStudent {
  id: string;
  firstName: string;
  lastName: string;
}

/**
 * « Mes absences » (STUDENT) / « Absences » (PARENT) : historique des
 * présences via GET /attendances/student (périmètre vérifié serveur).
 */
export default function MyAbsencesPage() {
  const role = useAuthStore((state) => state.role);
  const isParent = role === "PARENT";
  const childId = useEffectiveChildId(isParent);
  const childrenQuery = useMyChildren(isParent);

  const meQuery = useQuery({
    queryKey: KEYS.studentsMe,
    queryFn: async () => (await api.get<MeStudent>(API.studentsMe)).data,
    enabled: !isParent,
  });

  const studentId = isParent ? childId : (meQuery.data?.id ?? "");
  const historyQuery = useQuery({
    queryKey: KEYS.attendancesByStudent(studentId),
    queryFn: async () =>
      (
        await api.get<AttendanceHistoryItem[]>(API.attendancesByStudent, {
          params: { studentId },
        })
      ).data,
    enabled: !!studentId,
  });

  const items = historyQuery.data ?? [];
  const counts = (Object.keys(ATTENDANCE_STATUS_META) as AttendanceStatus[]).map(
    (status) => ({
      status,
      count: items.filter((item) => item.status === status).length,
    }),
  );

  const loading =
    (isParent ? childrenQuery.isPending : meQuery.isPending) ||
    (studentId ? historyQuery.isPending : false);

  return (
    <div>
      <PageHeader
        title={isParent ? "Absences" : "Mes absences"}
        description={
          studentId && items.length > 0
            ? `${items.length} relevé(s) enregistré(s).`
            : "Historique des présences, retards et absences."
        }
      />

      {isParent && <ChildSelector />}

      {!studentId && !loading ? (
        <EmptyState
          title={isParent ? "Aucun enfant lié" : "Aucun dossier élève"}
          description={
            isParent
              ? "Aucun enfant n'est lié à votre compte. Contactez la direction."
              : "Aucun dossier élève n'est lié à votre compte. Contactez la direction."
          }
        />
      ) : historyQuery.isError ? (
        <ErrorState
          message={getErrorMessage(historyQuery.error)}
          onRetry={() => {
            void historyQuery.refetch();
          }}
        />
      ) : loading ? (
        <Skeleton className="h-[240px] rounded-r2" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun relevé pour le moment"
          description="Les présences relevées en classe apparaîtront ici."
        />
      ) : (
        <div className="flex flex-col gap-p4">
          <div className="flex flex-wrap gap-p2" aria-live="polite">
            {counts.map(({ status, count }) => (
              <Badge
                key={status}
                variant={
                  count > 0
                    ? status === "PRESENT"
                      ? "success"
                      : status === "ABSENT"
                        ? "destructive"
                        : status === "LATE"
                          ? "warning"
                          : "default"
                    : "neutral"
                }
              >
                {ATTENDANCE_STATUS_META[status].label} : {count}
              </Badge>
            ))}
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <tr>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Classe</TableHeaderCell>
                  <TableHeaderCell>Statut</TableHeaderCell>
                </tr>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCellPrimary>{formatDateFr(item.date)}</TableCellPrimary>
                    <TableCell>{item.classroom.name}</TableCell>
                    <TableCell>{ATTENDANCE_STATUS_META[item.status].label}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </div>
  );
}
