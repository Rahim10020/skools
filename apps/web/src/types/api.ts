export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  user: AuthUser;
  establishmentId: string | null;
  role: string | null;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Formes de lecture API partagées (mirroirs des `select` backend).
 * Règle : toute interface `{id,…}` dupliquée entre pages vit ici.
 * Les formes métier propres à une page (bulletin, affectation…) restent locales.
 */
export interface IdName {
  id: string;
  name: string;
}

export interface AcademicYearRef {
  id: string;
  name: string;
  isCurrent: boolean;
}

export interface PersonRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface StudentRow extends PersonRef {
  matricule: string | null;
}

export interface EnrollmentRow {
  classroomId: string;
  isActive: boolean;
  student: StudentRow | null;
}

/** Forme des erreurs renvoyées par l'API NestJS (ValidationPipe / HttpException). */
export interface ApiErrorShape {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}
