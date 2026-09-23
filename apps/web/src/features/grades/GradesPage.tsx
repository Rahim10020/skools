import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";

export default function GradesPage() {
  const queryClient = useQueryClient();
  const [selectedExamId, setSelectedExamId] = useState("");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [absents, setAbsents] = useState<Record<string, boolean>>({});

  const { data: exams = [] } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => (await api.get("/exams")).data,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => (await api.get("/students")).data,
  });

  const { data: existingGrades = [], isLoading: loadingGrades } = useQuery({
    queryKey: ["grades", selectedExamId],
    queryFn: async () => {
      if (!selectedExamId) return [];
      const res = await api.get(`/grades?examId=${selectedExamId}`);
      return res.data;
    },
    enabled: !!selectedExamId,
  });

  // Pré-remplir les notes existantes quand on change d'examen
  useState(() => {
    if (existingGrades.length > 0) {
      const initialScores: Record<string, string> = {};
      const initialAbsents: Record<string, boolean> = {};

      existingGrades.forEach((grade: any) => {
        initialScores[grade.studentId] = grade.score?.toString() ?? "";
        initialAbsents[grade.studentId] = grade.isAbsent;
      });

      setScores(initialScores);
      setAbsents(initialAbsents);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const grades = students.map((student: any) => ({
        examId: selectedExamId,
        studentId: student.id,
        score: absents[student.id]
          ? undefined
          : Number(scores[student.id]) || undefined,
        isAbsent: absents[student.id] || false,
      }));

      return api.post("/grades/bulk", {
        examId: selectedExamId,
        grades,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades", selectedExamId] });
      alert("Notes enregistrées avec succès");
    },
  });

  const selectedExam = exams.find((e: any) => e.id === selectedExamId);

  const handleScoreChange = (studentId: string, value: string) => {
    setScores((prev) => ({ ...prev, [studentId]: value }));
    if (value) {
      setAbsents((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const handleAbsentChange = (studentId: string, checked: boolean) => {
    setAbsents((prev) => ({ ...prev, [studentId]: checked }));
    if (checked) {
      setScores((prev) => ({ ...prev, [studentId]: "" }));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saisie des notes</h1>
      </div>

      {/* Sélection de l'examen */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sélectionner un examen
        </label>
        <select
          value={selectedExamId}
          onChange={(e) => {
            setSelectedExamId(e.target.value);
            setScores({});
            setAbsents({});
          }}
          className="block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Choisir un examen...</option>
          {exams.map((exam: any) => (
            <option key={exam.id} value={exam.id}>
              {exam.name} — {exam.subject?.name}{" "}
              {exam.classroom ? `(${exam.classroom.name})` : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedExamId && (
        <>
          {selectedExam && (
            <div className="mb-4 text-sm text-gray-600">
              <span className="font-medium">Note max :</span>{" "}
              {selectedExam.maxScore} |{" "}
              <span className="font-medium">Coefficient :</span>{" "}
              {selectedExam.coefficient}
            </div>
          )}

          {loadingGrades ? (
            <p className="text-gray-500">Chargement des notes...</p>
          ) : students.length === 0 ? (
            <p className="text-gray-500">Aucun élève disponible.</p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Élève
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Matricule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Note
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Absent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student: any) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {student.lastName} {student.firstName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.matricule || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max={selectedExam?.maxScore || 20}
                          value={scores[student.id] || ""}
                          onChange={(e) =>
                            handleScoreChange(student.id, e.target.value)
                          }
                          disabled={absents[student.id]}
                          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={absents[student.id] || false}
                          onChange={(e) =>
                            handleAbsentChange(student.id, e.target.checked)
                          }
                          className="h-4 w-4"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveMutation.isPending
                    ? "Enregistrement..."
                    : "Enregistrer les notes"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
