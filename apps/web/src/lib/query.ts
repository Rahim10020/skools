import { QueryClient } from "@tanstack/react-query";

/**
 * Client React Query partagé.
 * - staleTime 30 s : évite les refetchs en cascade lors des allers-retours
 *   (contexte du bug notes/présences : distinguer UI/cache du backend).
 * - refetchOnWindowFocus désactivé : pas de relecture surprise au retour d'onglet.
 * - retry : 1 en lecture (le 401 est géré par l'intercepteur axios), 0 en mutation.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
