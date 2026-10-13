import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SkoolsTheme = "light" | "dark";

const STORAGE_KEY = "skools-theme";

function applyThemeClass(theme: SkoolsTheme) {
  const root = document.documentElement;
  // La classe .dark pilote toutes les variantes `dark:` et les tokens .dark.
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

interface ThemeState {
  theme: SkoolsTheme;
  setTheme: (theme: SkoolsTheme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // clair par défaut (contexte éducation).
      theme: "light",

      setTheme: (theme) => {
        applyThemeClass(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const next: SkoolsTheme = get().theme === "dark" ? "light" : "dark";
        applyThemeClass(next);
        set({ theme: next });
      },
    }),
    { name: STORAGE_KEY },
  ),
);

/**
 * À appeler une fois au bootstrap (main.tsx, avant le render) :
 * applique le thème persisté de façon synchrone (anti-flash)
 * puis synchronise la classe <html> à chaque changement.
 */
export function initTheme() {
  applyThemeClass(useThemeStore.getState().theme);
  useThemeStore.subscribe((state) => applyThemeClass(state.theme));
}
