import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  establishmentId: string | null;
  role: string | null;
  setAuth: (data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    establishmentId?: string | null;
    role?: string | null;
  }) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      establishmentId: null,
      role: null,

      setAuth: (data) =>
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          establishmentId: data.establishmentId ?? null,
          role: data.role ?? null,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          establishmentId: null,
          role: null,
        }),

      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: "skools-auth",
    },
  ),
);
