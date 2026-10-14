import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import { PageHeader } from "../../layouts/PageHeader";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
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
import { Select } from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "../../components/ui/toast";

interface ExamOption {
  id: string;
  name: string;
  maxScore: number;
  coefficient: number;
  classroomId: string | null;
  subject: { id: string; name: string };
  classroom: { id: string; name: string } | null;
}

interface StudentRow {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string | null;
}

interface ExistingGrade {
  id: string;
  examId: string;
  studentId: string;
  score: number | null;
  appreciation: string | null;
  isAbsent: boolean;
}

interface EnrollmentRow {
  classroomId: string;
  isActive: boolean;
  student: StudentRow | null;
}

/**
 * Saisie des notes par examen (POST /grades/bulk = upsert côté API).
 *
 * Correctifs du bug "notes qui disparaissent" (todo.txt) :
 * 1. La pré-remplissage depuis les notes existantes passe par useEffect
 *    (l'ancien useState(() => …) ne s'exécutait qu'une fois, jamais après refetch).
 * 2. La note 0/20 est préservée : test explicite `raw === ""` au lieu de `Number(v) || undefined`.
 * 3. alert() remplacé par toast + erreur inline ; l'état local n'est PAS réinitialisé
 *    après save — le useEffect resynchronise depuis la relecture serveur.
 */
export default function GradesPage() {
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.role);
  const isTeacher = role === "TEACHER";
  // CENSEUR supervise en lecture seule (matrice) ; saisie réservée à DIRECTOR/TEACHER.
  const readOnly = role === "CENSEUR";
  const [selectedExamId, setSelectedExamId] = useState("");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [absents, setAbsents] = useState<Record<string, boolean>>({});
  const [appreciations, setAppreciations] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const examsQuery = useQuery({
    queryKey: ["exams"],
    queryFn: async () => (await api.get<ExamOption[]>("/exams")).data,
  });
  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: async () => (await api.get<StudentRow[]>("/students")).data,
    // Enseignant : registre via /enrollments (filtre serveur par assignation), pas la liste globale.
    enabled: !isTeacher,
  });
  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments"],
    queryFn: async () => (await api.get<EnrollmentRow[]>("/enrollments")).data,
  });
  const gradesQuery = useQuery({
    queryKey: ["grades", selectedExamId],
    queryFn: async () => {
      if (!selectedExamId) return [];
      return (await api.get<ExistingGrade[]>(`/grades?examId=${selectedExamId}`)).data;
    },
    enabled: !!selectedExamId,
  });

  const selectedExam = (examsQuery.data ?? []).find((exam) => exam.id === selectedExamId) ?? null;
  const maxScore = selectedExam?.maxScore ?? 20;

  // Périmètre de saisie : les inscrits actifs de la classe si l'examen est mono-classe,
  // sinon tous les élèves (examen multi-classes). Pour TEACHER, /enrollments et
  // /exams sont déjà filtrés serveur par assignation.
  const studentsInScope = (() => {
    const enrolled = (enrollmentsQuery.data ?? []).filter((e) => e.isActive && e.student);
    if (!selectedExam?.classroomId) {
      if (isTeacher) return enrolled.map((e) => e.student as StudentRow);
      return studentsQuery.data ?? [];
    }
    const enrolledIds = new Set(
      enrolled
        .filter((e) => e.classroomId === selectedExam.classroomId)
        .map((e) => (e.student as StudentRow).id),
    );
    if (isTeacher) return enrolled.map((e) => e.student as StudentRow).filter((s) => enrolledIds.has(s.id));
    return (studentsQuery.data ?? []).filter((student) => enrolledIds.has(student.id));
  })();

  // CORRECTIF n°1 : resynchronise le formulaire à chaque relecture serveur.
  // Ajustement pendant le rendu (pas d'effet) : ne s'exécute que quand la
  // référence des données change, sans écraser la saisie en cours.
  // L'ancien useState(() => …) ne s'exécutait qu'une fois, jamais après refetch.
  const serverGrades = gradesQuery.data;
  const [prevServerGrades, setPrevServerGrades] = useState(serverGrades);
  if (serverGrades !== prevServerGrades) {
    setPrevServerGrades(serverGrades);
    if (serverGrades && serverGrades.length > 0) {
      const nextScores: Record<string, string> = {};
      const nextAbsents: Record<string, boolean> = {};
      const nextAppreciations: Record<string, string> = {};
      for (const grade of serverGrades) {
        // CORRECTIF n°2 : score 0 préservé (toString() explicite, pas de ||).
        nextScores[grade.studentId] =
          grade.score === null || grade.score === undefined ? "" : String(grade.score);
        nextAbsents[grade.studentId] = grade.isAbsent;
        nextAppreciations[grade.studentId] = grade.appreciation ?? "";
      }
      setScores(nextScores);
      setAbsents(nextAbsents);
      setAppreciations(nextAppreciations);
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const grades = studentsInScope.map((student) => {
        const raw = scores[student.id] ?? "";
        const isAbsent = absents[student.id] || false;
        const appreciation = (appreciations[student.id] ?? "").trim();
        return {
          examId: selectedExamId,
          studentId: student.id,
          // CORRECTIF n°2 (envoi) : "" → undefined, "0" → 0.
          score: isAbsent || raw === "" ? undefined : Number(raw),
          appreciation: appreciation === "" ? undefined : appreciation,
          isAbsent,
        };
      });
      return api.post("/grades/bulk", { examId: selectedExamId, grades });
    },
    onSuccess: async () => {
      // CORRECTIF n°3 : invalidation + relecture attendue (preuve de persistance).
      await queryClient.invalidateQueries({ queryKey: ["grades", selectedExamId] });
      await gradesQuery.refetch();
      setSubmitError(null);
      toast.success("Notes enregistrées avec succès");
    },
    onError: (error) => setSubmitError(getErrorMessage(error)),
  });

  const handleSelectExam = (examId: string) => {
    setSelectedExamId(examId);
    setScores({});
    setAbsents({});
    setAppreciations({});
    setSubmitError(null);
  };

  const handleScoreChange = (studentId: string, value: string) => {
    setScores((prev) => ({ ...prev, [studentId]: value }));
    if (value !== "") {
      setAbsents((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const handleAbsentChange = (studentId: string, checked: boolean) => {
    setAbsents((prev) => ({ ...prev, [studentId]: checked }));
    if (checked) {
      setScores((prev) => ({ ...prev, [studentId]: "" }));
    }
  };

  const handleSave = () => {
    // Garde-fou local : notes hors bornes ou non numériques.
    for (const student of studentsInScope) {
      const raw = scores[student.id] ?? "";
      if (raw === "" || absents[student.id]) continue;
      const numeric = Number(raw);
      if (Number.isNaN(numeric) || numeric < 0 || numeric > maxScore) {
        setSubmitError(
          `Note invalide pour ${student.lastName} ${student.firstName} : saisir un nombre entre 0 et ${maxScore}.`,
        );
        return;
      }
    }
    setSubmitError(null);
    saveMutation.mutate();
  };

  const existingCount = (gradesQuery.data ?? []).length;
  // Requête désactivée (enabled: false) reste en `pending` : ne pas bloquer dessus.
  const rosterPending = isTeacher
    ? enrollmentsQuery.isPending
    : studentsQuery.isPending || enrollmentsQuery.isPending;

  return (
    <div>
      <PageHeader
        title="Saisie des notes"
        description={
          selectedExam
            ? `${selectedExam.name} — ${selectedExam.subject.name}${selectedExam.classroom ? ` (${selectedExam.classroom.name})` : ""} · Note max : ${selectedExam.maxScore} · Coeff. ${selectedExam.coefficient}${existingCount > 0 ? ` · ${existingCount} note(s) enregistrée(s)` : ""}`
            : "Sélectionnez un examen pour saisir les notes."
        }
      />

      <Card className="p-p4">
        <label className="text-m12 text-(--skools-text-primary)">Examen</label>
        <div className="mt-p2">
          <Select
            label="Choisir un examen…"
            value={selectedExamId}
            onChange={handleSelectExam}
            options={(examsQuery.data ?? []).map((exam) => ({
              label: `${exam.name} — ${exam.subject.name}${exam.classroom ? ` (${exam.classroom.name})` : ""}`,
              value: exam.id,
            }))}
          />
        </div>
      </Card>

      {selectedExamId && (
        <div className="mt-p6">
          {gradesQuery.isError ? (
            <ErrorState
              message={getErrorMessage(gradesQuery.error)}
              onRetry={() => {
                void gradesQuery.refetch();
              }}
            />
          ) : gradesQuery.isPending || rosterPending ? (
            <Skeleton className="h-[240px] rounded-r2" />
          ) : studentsInScope.length === 0 ? (
            <EmptyState
              title="Aucun élève dans le périmètre"
              description={
                selectedExam?.classroomId
                  ? "Aucun élève inscrit dans la classe de cet examen. Vérifiez les inscriptions."
                  : "Aucun élève enregistré. Créez d'abord des élèves."
              }
            />
          ) : (
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
                  {studentsInScope.map((student) => (
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
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          disabled={readOnly || absents[student.id] || saveMutation.isPending}
                          className="w-24 rounded-(--radius-r1) border border-(--skools-border-subtle) bg-(--skools-elevated-bg) px-2 py-1 text-r14 text-(--skools-text-primary) outline-none disabled:opacity-50"
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={absents[student.id] || false}
                          onChange={(checked) => handleAbsentChange(student.id, checked)}
                          id={`absent-${student.id}`}
                          disabled={readOnly || saveMutation.isPending}
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
                            setAppreciations((prev) => ({ ...prev, [student.id]: e.target.value }))
                          }
                          disabled={readOnly || saveMutation.isPending}
                          className="w-40 rounded-(--radius-r1) border border-(--skools-border-subtle) bg-(--skools-elevated-bg) px-2 py-1 text-r14 text-(--skools-text-primary) outline-none disabled:opacity-50"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="px-p6 py-4 border-t border-(--skools-border-subtle)">
                {readOnly ? (
                  <p className="text-r14 text-(--skools-text-muted)">
                    Lecture seule : la saisie est réservée à la direction et aux enseignants.
                  </p>
                ) : (
                  <>
                    {submitError && (
                      <p role="alert" className="text-r14 text-(--common-red) mb-p3">
                        {submitError}
                      </p>
                    )}
                    <Button
                      fullWidth={false}
                      variant={saveMutation.isPending ? "loading" : "primary"}
                      disabled={saveMutation.isPending}
                      onClick={handleSave}
                    >
                      {saveMutation.isPending ? "Enregistrement…" : "Enregistrer les notes"}
                    </Button>
                  </>
                )}
              </div>
            </TableContainer>
          )}
        </div>
      )}
    </div>
  );
}
