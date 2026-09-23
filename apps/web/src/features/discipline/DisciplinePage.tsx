import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../../lib/api";

const TYPES = [
  { value: "OBSERVATION", label: "Observation" },
  { value: "WARNING", label: "Avertissement" },
  { value: "REPRIMAND", label: "Blâme" },
  { value: "DETENTION", label: "Retenue" },
  { value: "SUSPENSION", label: "Exclusion temporaire" },
  { value: "EXPULSION", label: "Exclusion définitive" },
  { value: "OTHER", label: "Autre" },
];

const schema = z.object({
  studentId: z.string().uuid("Élève requis"),
  type: z.enum([
    "WARNING",
    "REPRIMAND",
    "DETENTION",
    "SUSPENSION",
    "EXPULSION",
    "OBSERVATION",
    "OTHER",
  ]),
  title: z.string().min(3, "Titre requis"),
  description: z.string().optional(),
  incidentDate: z.string().min(1, "Date requise"),
});

type FormData = z.infer<typeof schema>;

export default function DisciplinePage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["discipline"],
    queryFn: async () => (await api.get("/discipline")).data,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => (await api.get("/students")).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post("/discipline", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discipline"] });
      setShowForm(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/discipline/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["discipline"] }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "OBSERVATION",
    },
  });

  const typeLabel = (type: string) =>
    TYPES.find((t) => t.value === type)?.label || type;

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ACTIVE: "bg-red-100 text-red-800",
      RESOLVED: "bg-green-100 text-green-800",
      CANCELLED: "bg-gray-100 text-gray-600",
    };
    return map[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Discipline</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          {showForm ? "Annuler" : "Nouvelle fiche"}
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
                <option value="">Sélectionner</option>
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.lastName} {s.firstName}
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
                Type
              </label>
              <select
                {...register("type")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Titre
              </label>
              <input
                {...register("title")}
                placeholder="Ex: Retard répété, Insolence..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date de l'incident
              </label>
              <input
                type="date"
                {...register("incidentDate")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.incidentDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.incidentDate.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Enregistrement..." : "Créer la fiche"}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-500">
          Aucune fiche disciplinaire pour le moment.
        </p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Élève
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.map((record: any) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(record.incidentDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {record.student?.lastName} {record.student?.firstName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {typeLabel(record.type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {record.title}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor(
                        record.status,
                      )}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => {
                        if (confirm("Supprimer cette fiche ?")) {
                          deleteMutation.mutate(record.id);
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
      )}
    </div>
  );
}
