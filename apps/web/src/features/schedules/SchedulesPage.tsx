import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../../lib/api";

const DAYS = [
  { value: "MONDAY", label: "Lundi" },
  { value: "TUESDAY", label: "Mardi" },
  { value: "WEDNESDAY", label: "Mercredi" },
  { value: "THURSDAY", label: "Jeudi" },
  { value: "FRIDAY", label: "Vendredi" },
  { value: "SATURDAY", label: "Samedi" },
];

const schema = z.object({
  classroomId: z.string().uuid("Classe requise"),
  subjectId: z.string().uuid("Matière requise"),
  teacherId: z.string().uuid().optional().or(z.literal("")),
  academicYearId: z.string().uuid("Année scolaire requise"),
  dayOfWeek: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ]),
  startTime: z.string().min(1, "Heure de début requise"),
  endTime: z.string().min(1, "Heure de fin requise"),
  room: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterClassroomId, setFilterClassroomId] = useState("");

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules", filterClassroomId],
    queryFn: async () => {
      const url = filterClassroomId
        ? `/schedules?classroomId=${filterClassroomId}`
        : "/schedules";
      return (await api.get(url)).data;
    },
  });

  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => (await api.get("/classrooms")).data,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/subjects")).data,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => (await api.get("/teachers")).data,
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => (await api.get("/academic-years")).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post("/schedules", {
        ...data,
        teacherId: data.teacherId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setShowForm(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/schedules/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules"] }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const dayLabel = (day: string) =>
    DAYS.find((d) => d.value === day)?.label || day;

  // Grouper par jour pour un affichage plus lisible
  const schedulesByDay = DAYS.map((day) => ({
    ...day,
    items: schedules.filter((s: any) => s.dayOfWeek === day.value),
  })).filter((d) => d.items.length > 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Emplois du temps</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          {showForm ? "Annuler" : "Nouveau créneau"}
        </button>
      </div>

      {/* Filtre par classe */}
      <div className="mb-6">
        <select
          value={filterClassroomId}
          onChange={(e) => setFilterClassroomId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Toutes les classes</option>
          {classrooms.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="bg-white p-6 rounded-lg border border-gray-200 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Classe
              </label>
              <select
                {...register("classroomId")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Sélectionner</option>
                {classrooms.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
                Matière
              </label>
              <select
                {...register("subjectId")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Sélectionner</option>
                {subjects.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.subjectId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.subjectId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enseignant
              </label>
              <select
                {...register("teacherId")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Aucun</option>
                {teachers.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.lastName} {t.firstName}
                  </option>
                ))}
              </select>
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
                {academicYears.map((y: any) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
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
                Jour
              </label>
              <select
                {...register("dayOfWeek")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Salle
              </label>
              <input
                {...register("room")}
                placeholder="Ex: Salle 12"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Heure de début
              </label>
              <input
                type="time"
                {...register("startTime")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.startTime.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Heure de fin
              </label>
              <input
                type="time"
                {...register("endTime")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Création..." : "Ajouter le créneau"}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : schedules.length === 0 ? (
        <p className="text-gray-500">Aucun créneau pour le moment.</p>
      ) : (
        <div className="space-y-6">
          {schedulesByDay.map((day) => (
            <div
              key={day.value}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">
                  {day.label}
                </h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">
                      Horaire
                    </th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">
                      Matière
                    </th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">
                      Classe
                    </th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">
                      Enseignant
                    </th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">
                      Salle
                    </th>
                    <th className="px-6 py-2 text-right text-xs font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {day.items.map((schedule: any) => (
                    <tr key={schedule.id}>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {schedule.startTime} - {schedule.endTime}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {schedule.subject?.name}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {schedule.classroom?.name}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {schedule.teacher
                          ? `${schedule.teacher.lastName} ${schedule.teacher.firstName}`
                          : "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {schedule.room || "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-right">
                        <button
                          onClick={() => {
                            if (confirm("Supprimer ce créneau ?")) {
                              deleteMutation.mutate(schedule.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
