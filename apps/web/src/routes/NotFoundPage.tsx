import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Wordmark } from "../components/Wordmark";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-p4 bg-(--skools-app-bg) text-(--skools-text-primary) text-center px-p4">
      <Wordmark />
      <p className="text-sb32">404</p>
      <p className="text-r14 text-(--skools-text-muted)">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link to="/dashboard">
        <Button fullWidth={false}>Retour au tableau de bord</Button>
      </Link>
    </div>
  );
}
