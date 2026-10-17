/** Valeurs de genre acceptées (stockées telles quelles, libellés complets). */
export const GENDERS = ['Masculin', 'Féminin'] as const;
export type Gender = (typeof GENDERS)[number];
