import { ThemeToggle } from "../../components/ThemeToggle";
import { Icon } from "../../components/icons/Icon";
import * as Icons from "../../components/icons/index";

const { Icon: _omit, ...iconMap } = Icons;
void _omit;

/**
 * Page temporaire de validation visuelle Phase 1 (palette, typo, icônes, thème).
 * Sera supprimée en Phase 3 lors de la mise en place du shell définitif.
 */
export default function FoundationPreviewPage() {
  return (
    <div className="min-h-screen bg-(--skools-app-bg) text-(--skools-text-primary)">
      <div className="mx-auto max-w-[1280px] px-p4 pt-p13 sm:px-p10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-sb32">Skools</h1>
            <p className="text-r14 text-(--skools-text-muted)">
              Fondation visuelle — tokens, typographie, icônes, thème
            </p>
          </div>
          <ThemeToggle />
        </header>

        <section className="mt-p8">
          <h2 className="text-sb20">Couleurs</h2>
          <div className="mt-p4 grid grid-cols-2 gap-p4 sm:grid-cols-4">
            <div className="rounded-r2 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) p-p4">
              <div className="h-(--size-s10) rounded-r1 bg-(--skools-app-bg)" />
              <p className="text-m12 mt-p2">app-bg</p>
            </div>
            <div className="rounded-r2 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) p-p4">
              <div className="h-(--size-s10) rounded-r1 bg-(--skools-elevated-bg)" />
              <p className="text-m12 mt-p2">elevated-bg</p>
            </div>
            <div className="rounded-r2 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) p-p4">
              <div className="h-(--size-s10) rounded-r1 bg-(--primary)" />
              <p className="text-m12 mt-p2">primary #0e0637</p>
            </div>
            <div className="rounded-r2 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) p-p4">
              <div className="h-(--size-s10) rounded-r1 bg-common-eplblue" />
              <p className="text-m12 mt-p2">eplblue #0F49A7</p>
            </div>
          </div>
        </section>

        <section className="mt-p8">
          <h2 className="text-sb20">Typographie Inter</h2>
          <div className="mt-p4 rounded-r2 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) p-p4">
            <p className="text-dp24">Display 24 bold</p>
            <p className="text-sb16 mt-p2">Semibold 16 — AaÉè 0123456789</p>
            <p className="text-m14 mt-p2">Medium 14 — AaÉè 0123456789</p>
            <p className="text-r14 mt-p2">Regular 14 — AaÉè 0123456789</p>
            <p className="text-l14 mt-p2">Light 14 — AaÉè 0123456789</p>
          </div>
        </section>

        <section className="mt-p8 pb-p10">
          <h2 className="text-sb20">Icônes ({Object.keys(iconMap).length})</h2>
          <div className="mt-p4 grid grid-cols-4 gap-p4 sm:grid-cols-6">
            {Object.entries(iconMap).map(([name, C]) => (
              <div
                key={name}
                className="flex flex-col items-center gap-p2 rounded-r2 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) p-p4 text-(--skools-icon-primary)"
              >
                <Icon component={C} size={22} />
                <span className="text-r10 text-(--skools-text-muted)">{name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
