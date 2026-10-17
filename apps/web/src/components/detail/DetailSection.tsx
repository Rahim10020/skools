import type { ReactNode } from "react";

/**
 * Socle des pages détail (fiches) : colonne centrée, sections titrées,
 * paires label/valeur inline, sous-listes hairline.
 */
export function DetailContainer({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-190 mx-auto flex flex-col gap-p8 pb-p20 mt-p10">
      {children}
    </div>
  );
}

/**
 * Barre d'en-tête fixe des fiches : reste collée en haut au scroll
 * (le scroll est sur window, pas de conteneur contraint).
 * `top-14` compense la topbar mobile fixe, `lg:top-0` sur desktop.
 */
export function StickyBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-14 lg:top-0 z-20 bg-(--skools-app-bg) py-p2">
      {children}
    </div>
  );
}

export function DetailSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-p3">
      <h3 className="font-semibold text-sb16 text-(--skools-text-primary) mb-p1">
        {title}
        {count !== undefined && (
          <span className="ml-p2 text-r14 font-normal text-(--skools-text-muted)">
            ({count})
          </span>
        )}
      </h3>
      {children}
    </section>
  );
}

/**
 * Ligne de synthèse (taux de présence, moyenne…) : pastille d'évaluation,
 * valeur mise en avant et détail compact, dans le style inline des fiches.
 */
export function DetailStat({
  badge,
  value,
  caption,
}: {
  badge?: ReactNode;
  value: ReactNode;
  caption?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-p2">
      {badge}
      <span className="font-semibold text-r14 text-(--skools-text-primary)">
        {value}
      </span>
      {caption && (
        <span className="text-r12 text-(--skools-text-muted)">{caption}</span>
      )}
    </div>
  );
}

export function DetailRow({
  primary,
  secondary,
  right,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_max-content] items-center gap-p3 py-p2">
      <div className="min-w-0">
        <p className="truncate text-r14 text-(--skools-text-primary)">
          {primary}
        </p>
        {secondary && (
          <p className="truncate text-r12 text-(--skools-text-muted)">
            {secondary}
          </p>
        )}
      </div>
      {right && <div className="flex items-center gap-p2">{right}</div>}
    </div>
  );
}

export function DetailFields({
  fields,
}: {
  fields: Array<[string, ReactNode]>;
}) {
  return (
    <dl className="flex flex-col gap-p2">
      {fields.map(([label, value]) => (
        <div key={label} className="min-w-max flex items-center gap-p2">
          <dt className="font-semibold text-sb14 text-(--skools-text-primary)">
            {label}
          </dt>
          <dd className="text-r14 text-(--skools-text-muted)">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function HairlineList<T>({
  items,
  idOf,
  render,
}: {
  items: T[];
  idOf: (item: T) => string;
  render: (item: T) => ReactNode;
}) {
  return (
    <div className="flex flex-col">
      {items.map((item, idx) => (
        <div key={idOf(item)} className="flex flex-col">
          {render(item)}
          {idx < items.length - 1 && (
            <hr className="border-t-[0.4px] border-(--skools-border-subtle) w-full" />
          )}
        </div>
      ))}
    </div>
  );
}
