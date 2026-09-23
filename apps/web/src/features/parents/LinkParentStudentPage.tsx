import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import api from "../../lib/api";

const schema = z.object({
  parentId: z.string().uuid("Parent requis"),
  relation: z.enum(["FATHER", "MOTHER", "GUARDIAN", "OTHER"]),
  isPrimary: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;
type LinkData = FormData & { studentId: string };

export default function LinkParentStudentPage() {
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const { data: parents = [] } = useQuery({
    queryKey: ["parents"],
    queryFn: async () => (await api.get("/parents")).data,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => (await api.get("/students")).data,
  });

  const { data: links = [], isLoading: loadingLinks } = useQuery({
    queryKey: ["parent-students", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const res = await api.get(
        `/parent-students/student/${selectedStudentId}`,
      );
      return res.data;
    },
    enabled: !!selectedStudentId,
  });

  const linkMutation = useMutation({
    mutationFn: (data: LinkData) => api.post("/parent-students", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["parent-students", selectedStudentId],
      });
      reset();
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/parent-students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["parent-students", selectedStudentId],
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      relation: "OTHER",
      isPrimary: false,
    },
  });

  const relationLabel = (relation: string) => {
    const map: Record<string, string> = {
      FATHER: "Père",
      MOTHER: "Mère",
      GUARDIAN: "Tuteur",
      OTHER: "Autre",
    };
    return map[relation] || relation;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Lier Parents et Élèves
      </h1>

      {/* Sélection de l'élève */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sélectionner un élève
        </label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Choisir un élève...</option>
          {students.map((student: any) => (
            <option key={student.id} value={student.id}>
              {student.lastName} {student.firstName}
              {student.matricule ? ` (${student.matricule})` : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedStudentId && (
        <>
          {/* Formulaire de liaison */}
          <form
            onSubmit={handleSubmit((data) =>
              linkMutation.mutate({ ...data, studentId: selectedStudentId }),
            )}
            className="bg-white p-6 rounded-lg border border-gray-200 mb-6 space-y-4"
          >
            <h2 className="text-lg font-medium text-gray-900">
              Ajouter un parent
            </h2>

            {linkMutation.isError && (
              <p className="text-sm text-red-600">
                {axios.isAxiosError(linkMutation.error)
                  ? (linkMutation.error.response?.data?.message ??
                    "La liaison n'a pas pu être créée.")
                  : "La liaison n'a pas pu être créée."}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Parent
                </label>
                <select
                  {...register("parentId")}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner</option>
                  {parents.map((parent: any) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.lastName} {parent.firstName}
                    </option>
                  ))}
                </select>
                {errors.parentId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.parentId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Relation
                </label>
                <select
                  {...register("relation")}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="FATHER">Père</option>
                  <option value="MOTHER">Mère</option>
                  <option value="GUARDIAN">Tuteur</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  {...register("isPrimary")}
                  id="isPrimary"
                />
                <label htmlFor="isPrimary" className="text-sm text-gray-700">
                  Contact principal
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={linkMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {linkMutation.isPending ? "Liaison..." : "Lier ce parent"}
            </button>
          </form>

          {/* Liste des parents liés */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">
                Parents liés à cet élève
              </h3>
            </div>

            {loadingLinks ? (
              <p className="p-6 text-gray-500">Chargement...</p>
            ) : links.length === 0 ? (
              <p className="p-6 text-gray-500">
                Aucun parent lié pour le moment.
              </p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Relation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Principal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {links.map((link: any) => (
                    <tr key={link.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {link.parent?.lastName} {link.parent?.firstName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {relationLabel(link.relation)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {link.isPrimary ? "Oui" : "Non"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {link.parent?.phone || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <button
                          onClick={() => {
                            if (confirm("Supprimer cette liaison ?")) {
                              unlinkMutation.mutate(link.id);
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
