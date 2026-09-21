import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../../lib/api";

const schema = z.object({
  name: z.string().min(1, "Nom requis"),
  cycleId: z.string().uuid("Cycle requis"),
  order: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

export default function LevelsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: levels = [], isLoading } = useQuery({
    queryKey: ["levels"],
    queryFn: async () => {
      const res = await api.get("/levels");
      return res.data;
    },
  });

  const { data: cycles = [] } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const res = await api.get("/cycles");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post("/levels", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["levels"] });
      setShowForm(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/levels/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["levels"] }),
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
        <h1 className="text-2xl font-bold text-gray-900">Niveaux</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          {showForm ? "Annuler" : "Nouveau niveau"}
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
                Nom
              </label>
              <input
                {...register("name")}
                placeholder="Ex: 6ème, 5ème, Seconde..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cycle
              </label>
              <select
                {...register("cycleId")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Sélectionner un cycle</option>
                {cycles.map((cycle: any) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </option>
                ))}
              </select>
              {errors.cycleId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.cycleId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ordre
              </label>
              <input
                type="number"
                {...register("order")}
                placeholder="0"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Création..." : "Créer le niveau"}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : levels.length === 0 ? (
        <p className="text-gray-500">Aucun niveau pour le moment.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cycle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ordre
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {levels.map((level: any) => (
                <tr key={level.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {level.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {level.cycle?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {level.order}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => {
                        if (confirm("Supprimer ce niveau ?"))
                          deleteMutation.mutate(level.id);
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
