import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "../types/api";

type User = AuthUser;

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  establishmentId: string | null;
  role: string | null;
  hasHydrated: boolean;
  setAuth: (data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    establishmentId?: string | null;
    role?: string | null;
  }) => void;
  /** Mise à jour du profil sans toucher aux tokens (ex. après PATCH /users ou GET /auth/me). */
  setUser: (user: User) => void;
  /** Mémorise l'établissement courant (ex. après POST /establishments qui régénère les tokens). */
  setEstablishment: (establishmentId: string | null, role: string | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      establishmentId: null,
      role: null,
      hasHydrated: false,

      setAuth: (data) =>
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          establishmentId: data.establishmentId ?? null,
          role: data.role ?? null,
        }),

      setUser: (user) => set({ user }),

      setEstablishment: (establishmentId, role) =>
        set({ establishmentId, role }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          establishmentId: null,
          role: null,
        }),

      isAuthenticated: () => !!get().accessToken,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "skools-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
