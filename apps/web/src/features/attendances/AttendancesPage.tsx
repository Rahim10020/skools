import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export default function AttendancesPage() {
  const queryClient = useQueryClient();
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(
    {},
  );

  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => (await api.get("/classrooms")).data,
  });

  // Élèves inscrits dans la classe sélectionnée (via enrollments)
  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments"],
    queryFn: async () => (await api.get("/enrollments")).data,
  });

  const studentsInClass = enrollments
    .filter((e: any) => e.classroomId === selectedClassroomId && e.isActive)
    .map((e: any) => e.student)
    .filter(Boolean);

  const { data: existingAttendances = [], isLoading } = useQuery({
    queryKey: ["attendances", selectedClassroomId, selectedDate],
    queryFn: async () => {
      if (!selectedClassroomId || !selectedDate) return [];
      const res = await api.get(
        `/attendances?classroomId=${selectedClassroomId}&date=${selectedDate}`,
      );
      return res.data;
    },
    enabled: !!selectedClassroomId && !!selectedDate,
  });

  // Pré-remplir les statuts existants
  useEffect(() => {
    if (existingAttendances.length > 0) {
      const initial: Record<string, AttendanceStatus> = {};
      existingAttendances.forEach((att: any) => {
        initial[att.studentId] = att.status;
      });
      setStatuses(initial);
    } else {
      // Par défaut tout le monde est présent
      const initial: Record<string, AttendanceStatus> = {};
      studentsInClass.forEach((student: any) => {
        initial[student.id] = "PRESENT";
      });
      setStatuses(initial);
    }
  }, [existingAttendances, selectedClassroomId, selectedDate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const attendances = studentsInClass.map((student: any) => ({
        studentId: student.id,
        status: statuses[student.id] || "PRESENT",
      }));

      return api.post("/attendances/bulk", {
        classroomId: selectedClassroomId,
        date: selectedDate,
        attendances,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendances", selectedClassroomId, selectedDate],
      });
      alert("Présences enregistrées");
    },
  });

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      PRESENT: "Présent",
      ABSENT: "Absent",
      LATE: "Retard",
      EXCUSED: "Excusé",
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      PRESENT: "bg-green-100 text-green-800",
      ABSENT: "bg-red-100 text-red-800",
      LATE: "bg-yellow-100 text-yellow-800",
      EXCUSED: "bg-blue-100 text-blue-800",
    };
    return map[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Présences</h1>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {selectedClassroomId && (
        <>
          {isLoading ? (
            <p className="text-gray-500">Chargement...</p>
          ) : studentsInClass.length === 0 ? (
            <p className="text-gray-500">
              Aucun élève inscrit dans cette classe.
            </p>
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
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {studentsInClass.map((student: any) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {student.lastName} {student.firstName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.matricule || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={statuses[student.id] || "PRESENT"}
                          onChange={(e) =>
                            setStatuses((prev) => ({
                              ...prev,
                              [student.id]: e.target.value as AttendanceStatus,
                            }))
                          }
                          className={`rounded-md border border-gray-300 px-2 py-1 text-sm ${statusColor(
                            statuses[student.id] || "PRESENT",
                          )}`}
                        >
                          <option value="PRESENT">Présent</option>
                          <option value="ABSENT">Absent</option>
                          <option value="LATE">Retard</option>
                          <option value="EXCUSED">Excusé</option>
                        </select>
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
                    : "Enregistrer les présences"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
