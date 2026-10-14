import { Link } from "react-router-dom";
import { Card, CardTitle } from "../../components/ui/card";
import { ArrowForwardIcon } from "../../components/icons/ArrowForwardIcon";

export interface StatCard {
  label: string;
  display: string;
  to: string;
}

/** Cartes de chiffres clés (une carte par stat, lien vers la page). */
export function StatCards({ stats }: { stats: StatCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-p4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Link key={stat.label} to={stat.to}>
          <Card className="p-p4 transition-colors hover:border-(--black-20)">
            <p className="text-r14 text-(--skools-text-muted)">{stat.label}</p>
            <p className="mt-p1 text-sb32 text-(--skools-text-primary)">
              {stat.display}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export interface Shortcut {
  to: string;
  label: string;
  description: string;
}

/** Accès rapides vers les pages du rôle. */
export function ShortcutGrid({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <section aria-label="Accès rapides">
      <h2 className="text-sb16 text-(--skools-text-primary) mb-p3">
        Accès rapides
      </h2>
      <div className="grid grid-cols-1 gap-p4 sm:grid-cols-2 xl:grid-cols-4">
        {shortcuts.map((shortcut) => (
          <Link key={shortcut.to} to={shortcut.to}>
            <Card className="p-p4 transition-colors hover:border-(--black-20)">
              <span className="flex items-center justify-between gap-p2">
                <CardTitle>{shortcut.label}</CardTitle>
                <ArrowForwardIcon className="size-4 shrink-0 text-(--skools-icon-muted)" />
              </span>
              <p className="mt-p1 text-r12 text-(--skools-text-muted)">
                {shortcut.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
