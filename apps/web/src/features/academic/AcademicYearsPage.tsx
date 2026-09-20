import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../../lib/api";

const schema = z.object({
  name: z.string().min(4, "Ex: 2025-2026"),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  isCurrent: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AcademicYearsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: years = [], isLoading } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const res = await api.get("/academic-years");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post("/academic-years", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      setShowForm(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academic-years/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      isCurrent: false,
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Années scolaires</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          {showForm ? "Annuler" : "Nouvelle année"}
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-6 rounded-lg border border-gray-200 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom
              </label>
              <input
                {...register("name")}
                placeholder="2025-2026"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                {...register("isCurrent")}
                id="isCurrent"
              />
              <label htmlFor="isCurrent" className="text-sm text-gray-700">
                Définir comme année courante
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date de début
              </label>
              <input
                type="date"
                {...register("startDate")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date de fin
              </label>
              <input
                type="date"
                {...register("endDate")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Création..." : "Créer l'année"}
          </button>
        </form>
      )}

      {/* Liste */}
      {isLoading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : years.length === 0 ? (
        <p className="text-gray-500">Aucune année scolaire pour le moment.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Début
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fin
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
              {years.map((year: any) => (
                <tr key={year.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {year.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(year.startDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(year.endDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {year.isCurrent ? (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Courante
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => {
                        if (confirm("Supprimer cette année scolaire ?")) {
                          deleteMutation.mutate(year.id);
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
