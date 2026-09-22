import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../../lib/api";

const schema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  profession: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ParentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: parents = [], isLoading } = useQuery({
    queryKey: ["parents"],
    queryFn: async () => {
      const res = await api.get("/parents");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post("/parents", {
        ...data,
        email: data.email || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      setShowForm(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/parents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["parents"] }),
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
        <h1 className="text-2xl font-bold text-gray-900">Parents</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          {showForm ? "Annuler" : "Nouveau parent"}
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
                Prénom
              </label>
              <input
                {...register("firstName")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom
              </label>
              <input
                {...register("lastName")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                {...register("phone")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Profession
              </label>
              <input
                {...register("profession")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Adresse
              </label>
              <input
                {...register("address")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Création..." : "Créer le parent"}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : parents.length === 0 ? (
        <p className="text-gray-500">Aucun parent pour le moment.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nom complet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Profession
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {parents.map((parent: any) => (
                <tr key={parent.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {parent.lastName} {parent.firstName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {parent.phone || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {parent.email || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {parent.profession || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => {
                        if (confirm("Supprimer ce parent ?")) {
                          deleteMutation.mutate(parent.id);
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
