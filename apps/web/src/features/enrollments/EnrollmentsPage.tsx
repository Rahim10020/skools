import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../../lib/api";

const schema = z.object({
  studentId: z.string().uuid("Élève requis"),
  classroomId: z.string().uuid("Classe requise"),
  academicYearId: z.string().uuid("Année scolaire requise"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EnrollmentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["enrollments"],
    queryFn: async () => {
      const res = await api.get("/enrollments");
      return res.data;
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await api.get("/students");
      return res.data;
    },
  });

  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const res = await api.get("/classrooms");
      return res.data;
    },
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const res = await api.get("/academic-years");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post("/enrollments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      setShowForm(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/enrollments/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["enrollments"] }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inscriptions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          {showForm ? "Annuler" : "Nouvelle inscription"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="bg-white p-6 rounded-lg border border-gray-200 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Élève
              </label>
              <select
                {...register("studentId")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Sélectionner un élève</option>
                {students.map((student: any) => (
                  <option key={student.id} value={student.id}>
                    {student.lastName} {student.firstName}
                    {student.matricule ? ` (${student.matricule})` : ""}
                  </option>
                ))}
              </select>
              {errors.studentId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.studentId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Année scolaire
              </label>
              <select
                {...register("academicYearId")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Sélectionner</option>
                {academicYears.map((year: any) => (
                  <option key={year.id} value={year.id}>
                    {year.name} {year.isCurrent ? "(Courante)" : ""}
                  </option>
                ))}
              </select>
              {errors.academicYearId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.academicYearId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Classe
              </label>
              <select
                {...register("classroomId")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Sélectionner une classe</option>
                {classrooms.map((classroom: any) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
              {errors.classroomId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.classroomId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes (optionnel)
              </label>
              <input
                {...register("notes")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Inscription..." : "Inscrire l'élève"}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : enrollments.length === 0 ? (
        <p className="text-gray-500">Aucune inscription pour le moment.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Élève
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Classe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Année
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {enrollments.map((enrollment: any) => (
                <tr key={enrollment.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {enrollment.student?.lastName}{" "}
                    {enrollment.student?.firstName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {enrollment.classroom?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {enrollment.academicYear?.name}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {enrollment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {enrollment.enrolledAt
                      ? new Date(enrollment.enrolledAt).toLocaleDateString(
                          "fr-FR",
                        )
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => {
                        if (confirm("Annuler cette inscription ?")) {
                          deleteMutation.mutate(enrollment.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Annuler
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
