import type { PersonRef } from "../../types/api";
import { API } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { PageHeader } from "../../layouts/PageHeader";
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

interface StudentGrade {
  id: string;
  score: number | null;
  appreciation: string | null;
  isAbsent: boolean;
  exam: {
    id: string;
    name: string;
    maxScore: number;
    examDate: string | null;
    subject: { id: string; name: string };
  };
}

function formatScore(grade: StudentGrade): string {
  if (grade.isAbsent) return "Absent";
  if (grade.score === null) return "—";
  return `${grade.score}/${grade.exam.maxScore}`;
}

/**
 * « Mes notes » (STUDENT) : notes via GET /grades?studentId=
 * (périmètre vérifié serveur). Les parents utilisent « Notes & bulletins ».
 */
export default function MyGradesPage() {
  const meQuery = useQuery({
    queryKey: KEYS.studentsMe,
    queryFn: async () => (await api.get<PersonRef>(API.studentsMe)).data,
  });

  const studentId = meQuery.data?.id ?? "";
  const gradesQuery = useQuery({
    queryKey: KEYS.gradesByStudent(studentId),
    queryFn: async () =>
      (
        await api.get<StudentGrade[]>(API.grades, {
          params: { studentId },
        })
      ).data,
    enabled: !!studentId,
  });

  const grades = gradesQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title="Mes notes"
        description={
          grades.length > 0
            ? `${grades.length} note(s) enregistrée(s).`
            : "Vos notes par examen, toutes matières."
        }
      />

      {!studentId && !meQuery.isPending ? (
        <EmptyState
          title="Aucun dossier élève"
          description="Aucun dossier élève n'est lié à votre compte. Contactez la direction."
        />
      ) : gradesQuery.isError ? (
        <ErrorState
          message={getErrorMessage(gradesQuery.error)}
          onRetry={() => {
            void gradesQuery.refetch();
          }}
        />
      ) : meQuery.isPending || gradesQuery.isPending ? (
        <Skeleton className="h-[240px] rounded-r2" />
      ) : grades.length === 0 ? (
        <EmptyState
          title="Aucune note pour le moment"
          description="Les notes saisies par vos enseignants apparaîtront ici."
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Examen</TableHeaderCell>
                <TableHeaderCell>Matière</TableHeaderCell>
                <TableHeaderCell>Note</TableHeaderCell>
                <TableHeaderCell>Appréciation</TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {grades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCellPrimary>{grade.exam.name}</TableCellPrimary>
                  <TableCell>{grade.exam.subject.name}</TableCell>
                  <TableCell>{formatScore(grade)}</TableCell>
                  <TableCell>{grade.appreciation || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
