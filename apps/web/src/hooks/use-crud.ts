import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

/**
 * Ressource CRUD REST standard (GET liste / POST / PATCH /:id / DELETE /:id).
 * `listPath` permet d'ajouter des query params de filtre à la lecture
 * (ex. "/schedules?classroomId=…") ; les mutations utilisent `endpoint` nu.
 * Les toasts et l'invalidation sont gérés par l'appelant (CrudPage).
 */
export function useCrudResource<TList>(endpoint: string, queryKey: string[], listPath?: string) {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey,
    queryFn: async () => (await api.get<TList[]>(listPath ?? endpoint)).data,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createOne = useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      (await api.post(endpoint, data)).data,
  });

  const updateOne = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      (await api.patch(`${endpoint}/${id}`, data)).data,
  });

  const removeOne = useMutation({
    mutationFn: async (id: string) => (await api.delete(`${endpoint}/${id}`)).data,
  });

  return { list, createOne, updateOne, removeOne, invalidate };
}
