import type { StudentRow } from "../../types/api";
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
import { Checkbox } from "../../components/ui/checkbox";

interface GradesTableProps {
  students: StudentRow[];
  scores: Record<string, string>;
  absents: Record<string, boolean>;
  appreciations: Record<string, string>;
  maxScore: number;
  readOnly: boolean;
  disabled: boolean;
  onScoreChange: (studentId: string, value: string) => void;
  onAbsentChange: (studentId: string, checked: boolean) => void;
  onAppreciationChange: (studentId: string, value: string) => void;
}

/** Tableau de saisie : note + absent + appréciation par élève. */
export function GradesTable({
  students,
  scores,
  absents,
  appreciations,
  maxScore,
  readOnly,
  disabled,
  onScoreChange,
  onAbsentChange,
  onAppreciationChange,
}: GradesTableProps) {
  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <tr>
            <TableHeaderCell>Élève</TableHeaderCell>
            <TableHeaderCell>Matricule</TableHeaderCell>
            <TableHeaderCell>Note / {maxScore}</TableHeaderCell>
            <TableHeaderCell>Absent</TableHeaderCell>
            <TableHeaderCell>Appréciation</TableHeaderCell>
          </tr>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCellPrimary>
                {student.lastName} {student.firstName}
              </TableCellPrimary>
              <TableCell>{student.matricule || "—"}</TableCell>
              <TableCell>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max={maxScore}
                  aria-label={`Note de ${student.firstName} ${student.lastName}`}
                  value={scores[student.id] ?? ""}
                  onChange={(e) => onScoreChange(student.id, e.target.value)}
                  disabled={readOnly || absents[student.id] || disabled}
                  className="w-24 rounded-(--radius-r1) border border-(--skools-border-subtle) bg-(--skools-elevated-bg) px-2 py-1 text-r14 text-(--skools-text-primary) outline-none disabled:opacity-50"
                />
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={absents[student.id] || false}
                  onChange={(checked) => onAbsentChange(student.id, checked)}
                  id={`absent-${student.id}`}
                  disabled={readOnly || disabled}
                />
              </TableCell>
              <TableCell>
                <input
                  type="text"
                  maxLength={280}
                  aria-label={`Appréciation pour ${student.firstName} ${student.lastName}`}
                  placeholder="—"
                  value={appreciations[student.id] ?? ""}
                  onChange={(e) =>
                    onAppreciationChange(student.id, e.target.value)
                  }
                  disabled={readOnly || disabled}
                  className="w-40 rounded-(--radius-r1) border border-(--skools-border-subtle) bg-(--skools-elevated-bg) px-2 py-1 text-r14 text-(--skools-text-primary) outline-none disabled:opacity-50"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
