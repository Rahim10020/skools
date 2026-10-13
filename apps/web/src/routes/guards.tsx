import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store";
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
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

const SETUP_FREE_PATHS = ["/dashboard", "/create-establishment"];

/**
 * Les pages métier exigent un établissement courant.
 * /dashboard garde sa propre redirection (comportement actuel conservé).
 */
export function RequireEstablishment() {
  const establishmentId = useAuthStore((s) => s.establishmentId);
  const { pathname } = useLocation();

  if (!establishmentId && !SETUP_FREE_PATHS.includes(pathname)) {
    return <Navigate to="/create-establishment" replace />;
  }

  return <Outlet />;
}
