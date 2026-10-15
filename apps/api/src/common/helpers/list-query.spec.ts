import { describe, expect, it } from 'vitest';
import {
  LIST_DEFAULT_LIMIT,
  LIST_MAX_LIMIT,
  buildPagination,
  paginate,
  parseListQuery,
} from './list-query.js';

describe('parseListQuery', () => {
  it('retourne un tableau brut sans param (compat historique)', () => {
    expect(parseListQuery({}).paginated).toBe(false);
  });

  it('normalise page/limit et plafonne à 100', () => {
    const parsed = parseListQuery({ page: '3', limit: '999', search: '  awa ' });
    expect(parsed).toMatchObject({
      page: 3,
      limit: LIST_MAX_LIMIT,
      skip: 2 * LIST_MAX_LIMIT,
      search: 'awa',
      paginated: true,
    });
  });

  it('rejette les valeurs invalides vers les défauts', () => {
    const parsed = parseListQuery({ page: '0', limit: 'abc', search: '   ' });
    expect(parsed).toMatchObject({
      page: 1,
      limit: LIST_DEFAULT_LIMIT,
      skip: 0,
      search: undefined,
      paginated: true,
    });
  });

  it('détecte un filtre seul comme demande paginée', () => {
    expect(parseListQuery({ hasFilter: true }).paginated).toBe(true);
  });
});

describe('buildPagination', () => {
  it('calcule les pages façon epl', () => {
    expect(buildPagination(95, 2, 10)).toMatchObject({
      total_count: 95,
      page: 2,
      page_size: 10,
      total_pages: 10,
      has_next: true,
      has_previous: true,
      skip: 10,
      limit: 10,
    });
  });

  it('coince la page hors borne', () => {
    const envelope = buildPagination(5, 9, 10);
    expect(envelope.page).toBe(1);
    expect(envelope.has_next).toBe(false);
  });
});

describe('paginate', () => {
  it('enveloppe data + pagination', () => {
    expect(paginate([1, 2], 2, 1, 10).data).toEqual([1, 2]);
  });
});
