import axios, { AxiosError } from "axios";
import { useAuthStore } from "../stores/auth-store";
import { navigateTo } from "./navigation";
import type { ApiErrorShape, RefreshResponse } from "../types/api";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Bulletins de classe calculés en N+1 côté API : laisser une marge.
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetryableRequest {
  _retry?: boolean;
  headers: { Authorization?: string };
  url?: string;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & RetryableRequest) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Ne jamais boucler sur l'endpoint de refresh lui-même.
      if (originalRequest.url?.includes("/auth/refresh")) {
        useAuthStore.getState().logout();
        navigateTo("/login");
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post<RefreshResponse>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
          );

          // Contrats § Auth : le refresh ne renvoie que les tokens.
          // Le profil user / establishment / role est conservé tel quel.
          const state = useAuthStore.getState();
          if (!state.user) throw new Error("Session locale perdue");
          useAuthStore.getState().setAuth({
            user: state.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            establishmentId: state.establishmentId,
            role: state.role,
          });

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          navigateTo("/login");
        }
      } else {
        useAuthStore.getState().logout();
        navigateTo("/login");
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Déconnexion serveur best-effort (révocation du refresh token).
 * Le store local est nettoyé par l'appelant dans tous les cas.
 */
export async function requestServerLogout(refreshToken?: string) {
  try {
    await api.post("/auth/logout", refreshToken ? { refreshToken } : {});
  } catch {
    // Best-effort : un réseau coupé ne doit pas bloquer la déconnexion locale.
  }
}

/** Message affichable pour toute erreur d'appel API. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return "Serveur injoignable. Vérifiez votre connexion puis réessayez.";
    }
    if (error.response.status === 401) {
      return "Session expirée. Veuillez vous reconnecter.";
    }
    if (error.response.status === 403) {
      return "Action non autorisée pour votre rôle.";
    }
    const data = error.response.data as ApiErrorShape | undefined;
    const message = data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message.length > 0) return message;
    if (typeof data?.error === "string" && data.error.length > 0) return data.error;
    return `Erreur ${error.response.status}. Veuillez réessayer.`;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Une erreur inattendue est survenue.";
}

export default api;
