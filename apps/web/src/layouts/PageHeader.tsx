import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowBackIcon } from "../components/icons/ArrowBackIcon";

/**
 * En-tête de page standard (titre + description + actions).
 * Adopté par les pages métier en Phase 5.
 */
export function PageHeader({
  title,
  description,
  actions,
  backTo,
  backLabel = "Retour",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-p4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between mb-p6">
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-p1 text-r12 text-(--skools-text-muted) hover:text-(--skools-text-primary) mb-p2"
          >
            <ArrowBackIcon className="size-4" />
            {backLabel}
          </Link>
        )}
        <h1 className="text-sb24 text-(--skools-text-primary)">{title}</h1>
        {description && (
          <p className="text-r14 text-(--skools-text-muted) mt-p1">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-p3">{actions}</div>}
    </div>
  );
}
