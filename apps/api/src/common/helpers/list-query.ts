/**
 * Listes avec recherche, filtres et pagination : `?search=&page=&limit=` + filtres,
 * réponse `{ data, pagination }` (`total_count, page, page_size,
 * total_pages, has_next, has_previous, skip, limit`).
 *
 * Compat : l'enveloppe n'est renvoyée que si au moins un param de liste
 * est présent (`search/page/limit/filtre`). Sans param, les services
 * gardent le tableau brut historique (contrats docs/frontend-contracts.md).
 */

export const LIST_DEFAULT_LIMIT = 10;
export const LIST_MAX_LIMIT = 100;

export interface ParsedListQuery {
  page: number;
  limit: number;
  skip: number;
  search: string | undefined;
  /** Vrai si l'appelant veut l'enveloppe paginée (au moins un param présent). */
  paginated: boolean;
}

export interface PaginationEnvelope {
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  skip: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationEnvelope;
}

/** Normalise `page/limit/search` bruts (query string → nombres sûrs). */
export function parseListQuery(input: {
  page?: unknown;
  limit?: unknown;
  search?: unknown;
  hasFilter?: boolean;
}): ParsedListQuery {
  const rawPage = Number(input.page);
  const rawLimit = Number(input.limit);
  const page =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1
      ? Math.min(Math.floor(rawLimit), LIST_MAX_LIMIT)
      : LIST_DEFAULT_LIMIT;
  const search =
    typeof input.search === 'string' && input.search.trim() !== ''
      ? input.search.trim()
      : undefined;
  const paginated =
    input.page !== undefined ||
    input.limit !== undefined ||
    search !== undefined ||
    input.hasFilter === true;
  return { page, limit, skip: (page - 1) * limit, search, paginated };
}

export function buildPagination(
  total: number,
  page: number,
  limit: number,
): PaginationEnvelope {
  const total_pages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), total_pages);
  return {
    total_count: total,
    page: safePage,
    page_size: limit,
    total_pages,
    has_next: safePage < total_pages,
    has_previous: safePage > 1,
    skip: (safePage - 1) * limit,
    limit,
  };
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return { data: items, pagination: buildPagination(total, page, limit) };
}

/** Filtre Prisma `contains` insensible à la casse (PostgreSQL). */
export function containsInsensitive(fieldValue: string) {
  return { contains: fieldValue, mode: 'insensitive' as const };
}
