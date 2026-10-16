import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

/** Enveloppe de pagination : `{ data, pagination }`. */
export interface ListPagination {
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  skip: number;
  limit: number;
}

export interface PaginatedList<T> {
  data: T[];
  pagination: ListPagination;
}

/** Params de liste serveur (`?search=&page=&limit=` + filtres). */
export type ListParams = Record<string, string | number | undefined>;

function isPaginated<T>(payload: unknown): payload is PaginatedList<T> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    Array.isArray((payload as PaginatedList<T>).data) &&
    typeof (payload as PaginatedList<T>).pagination === "object"
  );
}

/**
 * Déballe une réponse liste : enveloppe `{ data, pagination }` ou tableau
 * brut historique. Source unique (partagée avec les pages custom type UsersPage).
 */
export function unwrapList<T>(raw: T[] | PaginatedList<T>): {
  items: T[];
  pagination: ListPagination | null;
} {
  if (isPaginated<T>(raw)) {
    return { items: raw.data, pagination: raw.pagination };
  }
  return { items: raw, pagination: null };
}

function toListPath(base: string, params?: ListParams) {
  if (!params) return base;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  if (!query) return base;
  return base.includes("?") ? `${base}&${query}` : `${base}?${query}`;
}

/**
 * Ressource CRUD REST standard (GET liste / POST / PATCH /:id / DELETE /:id).
 * `listPath` permet d'ajouter des query params de filtre à la lecture
 * (ex. `apiPath.schedulesByClassroom(…)`).
 * `params` ajoute `?search=&page=&limit=` + filtres serveur :
 * `items` contient toujours le tableau (enveloppe déballée ou non),
 * `pagination` est présent quand le backend pagine.
 * Les toasts et l'invalidation sont gérés par l'appelant (CrudPage).
 */
export function useCrudResource<TList>(
  endpoint: string,
  queryKey: readonly string[],
  listPath?: string,
  params?: ListParams,
) {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: [...queryKey, params ?? null] as readonly unknown[],
    queryFn: async () => {
      const raw = (await api.get<TList[] | PaginatedList<TList>>(toListPath(listPath ?? endpoint, params))).data;
      return unwrapList(raw);
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createOne = useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      (await api.post(endpoint, data)).data,
  });

  const updateOne = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => (await api.patch(`${endpoint}/${id}`, data)).data,
  });

  const removeOne = useMutation({
    mutationFn: async (id: string) =>
      (await api.delete(`${endpoint}/${id}`)).data,
  });

  return { list, createOne, updateOne, removeOne, invalidate };
}
