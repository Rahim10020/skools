import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../../lib/api";

const schema = z.object({
  name: z.string().min(2, "Nom requis"),
  order: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

export default function CyclesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const res = await api.get("/cycles");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post("/cycles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      setShowForm(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cycles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cycles"] }),
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
        <h1 className="text-2xl font-bold text-gray-900">Cycles</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          {showForm ? "Annuler" : "Nouveau cycle"}
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
                placeholder="Ex: Collège, Lycée, Primaire..."
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
            {isSubmitting ? "Création..." : "Créer le cycle"}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : cycles.length === 0 ? (
        <p className="text-gray-500">Aucun cycle pour le moment.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nom
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
              {cycles.map((cycle: any) => (
                <tr key={cycle.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {cycle.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {cycle.order}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => {
                        if (confirm("Supprimer ce cycle ?"))
                          deleteMutation.mutate(cycle.id);
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
