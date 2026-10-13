import { Outlet } from "react-router-dom";
import { AuthLayout } from "../features/auth/components/AuthLayout";

/**
 * Routes publiques : AuthLayout Skools (split EPL adapté).
 * Login/Register ne rendent que le formulaire (titre + champs + actions).
 */
export function GuestLayout() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}
