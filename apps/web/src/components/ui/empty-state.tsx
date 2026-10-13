import type { ReactNode } from "react";
import { InfoCircleIcon } from "../icons/InfoCircleIcon";
import { Button } from "./button";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-p3 rounded-r2 border border-(--skools-border-subtle)",
        "bg-(--skools-sidebar-bg) px-p6 py-p10 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="text-(--skools-icon-muted)">
        {icon ?? <InfoCircleIcon className="size-8" />}
      </span>
      <p className="text-sb16 text-(--skools-text-primary)">{title}</p>
      {description && <p className="text-r14 text-(--skools-text-muted) max-w-md">{description}</p>}
      {action}
    </div>
  );
}

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorState({
  title = "Une erreur est survenue",
  message = "Impossible de charger les données. Vérifiez votre connexion puis réessayez.",
  onRetry,
  retryLabel = "Réessayer",
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      title={title}
      description={message}
      className={className}
      action={
        onRetry ? (
          <Button variant="secondary" fullWidth={false} onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
    />
  );
}
