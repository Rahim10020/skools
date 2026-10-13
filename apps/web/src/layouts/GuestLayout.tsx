import { Outlet } from "react-router-dom";
import { Wordmark } from "../components/Wordmark";
import { Card } from "../components/ui/card";

/**
 * Layout des pages non authentifiées (login/register — câblé en Phase 4).
 * Carte centrée 400px sur fond applicatif + wordmark.
 */
export function GuestLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-(--skools-app-bg) text-(--skools-text-primary) px-p4 py-p10">
      <Wordmark />
      <Card className="mt-p6 w-full max-w-[400px] p-p6">
        <Outlet />
      </Card>
      <p className="mt-p6 text-r12 text-(--skools-text-muted)">Skools — gestion scolaire</p>
    </div>
  );
}
