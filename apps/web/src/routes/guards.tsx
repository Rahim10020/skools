import { ROUTES } from "../lib/routes";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store";
import { canAccess } from "../lib/permissions";
import { LoadingDots } from "../components/ui/button";

export function RequireAuth() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--skools-app-bg)">
        <LoadingDots />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return <Outlet />;
}

const SETUP_FREE_PATHS: string[] = [ROUTES.dashboard, ROUTES.createEstablishment, ROUTES.profil];

/**
 * Les pages métier exigent un établissement courant.
 * /dashboard garde sa propre redirection (comportement actuel conservé).
 */
export function RequireEstablishment() {
  const establishmentId = useAuthStore((s) => s.establishmentId);
  const { pathname } = useLocation();

  if (!establishmentId && !SETUP_FREE_PATHS.includes(pathname)) {
    return <Navigate to={ROUTES.createEstablishment} replace />;
  }

  return <Outlet />;
}

/**
 * Matrice d'accès (docs/access-matrix.md) : route non autorisée pour le rôle
 * → "Vue d'ensemble" (/dashboard). Le backend applique la même matrice (403).
 */
export function RequireRole() {
  const role = useAuthStore((s) => s.role);
  const { pathname } = useLocation();

  if (!canAccess(pathname, role)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
