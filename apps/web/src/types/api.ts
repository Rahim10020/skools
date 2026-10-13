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

/** Forme des erreurs renvoyées par l'API NestJS (ValidationPipe / HttpException). */
export interface ApiErrorShape {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}
