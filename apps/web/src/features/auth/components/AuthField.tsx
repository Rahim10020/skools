import type { ReactNode } from "react";

/** Champ de formulaire auth : libellé visible + contenu + message d'erreur accessible. */
export function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-p1">
      <label className="text-m12 text-(--skools-text-primary)">{label}</label>
      {children}
      {error && (
        <span role="alert" className="text-[12px] text-(--common-red) px-p1">
          {error}
        </span>
      )}
    </div>
  );
}

/** Erreur globale de soumission (réponse API). */
export function AuthRootError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-r14 text-(--common-red) text-center">
      {message}
    </p>
  );
}
