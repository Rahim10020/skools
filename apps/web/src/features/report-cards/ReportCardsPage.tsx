import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";

export default function ReportCardsPage() {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [viewMode, setViewMode] = useState<"student" | "classroom">("student");

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => (await api.get("/students")).data,
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => (await api.get("/academic-years")).data,
  });

  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => (await api.get("/classrooms")).data,
  });

  const { data: studentReport, isLoading: loadingStudent } = useQuery({
    queryKey: ["report-card", selectedStudentId, selectedYearId],
    queryFn: async () => {
      const res = await api.get(
        `/report-cards/student?studentId=${selectedStudentId}&academicYearId=${selectedYearId}`,
      );
      return res.data;
    },
    enabled: viewMode === "student" && !!selectedStudentId && !!selectedYearId,
  });

  const { data: classroomOverview = [], isLoading: loadingClassroom } =
    useQuery({
      queryKey: ["classroom-overview", selectedClassroomId, selectedYearId],
      queryFn: async () => {
        const res = await api.get(
          `/report-cards/classroom?classroomId=${selectedClassroomId}&academicYearId=${selectedYearId}`,
        );
        return res.data;
      },
      enabled:
        viewMode === "classroom" && !!selectedClassroomId && !!selectedYearId,
    });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Bulletins & Moyennes
      </h1>

      {/* Mode de vue */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode("student")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            viewMode === "student"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-300"
          }`}
        >
          Bulletin élève
        </button>
        <button
          onClick={() => setViewMode("classroom")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            viewMode === "classroom"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-300"
          }`}
        >
          Vue classe
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Année scolaire
          </label>
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Sélectionner</option>
            {academicYears.map((year: any) => (
              <option key={year.id} value={year.id}>
                {year.name} {year.isCurrent ? "(Courante)" : ""}
              </option>
            ))}
          </select>
        </div>

        {viewMode === "student" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Élève
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Sélectionner un élève</option>
              {students.map((student: any) => (
                <option key={student.id} value={student.id}>
                  {student.lastName} {student.firstName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Classe
            </label>
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Sélectionner une classe</option>
              {classrooms.map((classroom: any) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bulletin élève */}
      {viewMode === "student" && selectedStudentId && selectedYearId && (
        <>
          {loadingStudent ? (
            <p className="text-gray-500">Chargement du bulletin...</p>
          ) : studentReport ? (
            <div className="space-y-6">
              {/* En-tête */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {studentReport.student.lastName}{" "}
                  {studentReport.student.firstName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Matricule : {studentReport.student.matricule || "—"} | Classe
                  : {studentReport.classroom?.name || "—"} | Année :{" "}
                  {studentReport.academicYear?.name || "—"}
                </p>
                <p className="mt-3 text-xl font-bold text-blue-600">
                  Moyenne générale :{" "}
                  {studentReport.generalAverage !== null
                    ? `${studentReport.generalAverage}/20`
                    : "—"}
                </p>
              </div>

              {/* Détail par matière */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Matière
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Moyenne
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nb notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {studentReport.subjects.map((subject: any) => (
                      <tr key={subject.subjectId}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {subject.subjectName}
                          {subject.subjectCode && (
                            <span className="text-gray-400 ml-1">
                              ({subject.subjectCode})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                          {subject.average !== null
                            ? `${subject.average}/20`
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {subject.gradesCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Aucune donnée disponible.</p>
          )}
        </>
      )}

      {/* Vue classe */}
      {viewMode === "classroom" && selectedClassroomId && selectedYearId && (
        <>
          {loadingClassroom ? (
            <p className="text-gray-500">Chargement...</p>
          ) : classroomOverview.length === 0 ? (
            <p className="text-gray-500">Aucun élève dans cette classe.</p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Élève
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Matricule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Moyenne générale
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {classroomOverview.map((item: any, index: number) => (
                    <tr key={item.student.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.student.lastName} {item.student.firstName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.student.matricule || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {item.generalAverage !== null
                          ? `${item.generalAverage}/20`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
