import { useState, type ReactNode } from "react";

export interface HubTab {
  label: string;
  content: ReactNode;
}

const STORAGE_PREFIX = "skools-hub-tab-";

/**
 * Onglets d'une page hub (Structures, Matières & périodes, Examens & notes).
 * Onglet actif persisté par hub ; repli sur le premier si l'index est hors bornes.
 */
export function HubTabs({ storageKey, tabs }: { storageKey: string; tabs: HubTab[] }) {
  const [active, setActive] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_PREFIX + storageKey));
      if (Number.isInteger(saved) && saved >= 0 && saved < tabs.length) return saved;
    } catch {
      // Stockage indisponible : premier onglet.
    }
    return 0;
  });

  if (tabs.length === 0) return null;
  const current = Math.min(active, tabs.length - 1);

  const select = (index: number) => {
    setActive(index);
    try {
      localStorage.setItem(STORAGE_PREFIX + storageKey, String(index));
    } catch {
      // Stockage indisponible : l'onglet reste en mémoire de session.
    }
  };

  return (
    <div>
      <div role="tablist" aria-label="Sections" className="flex flex-wrap gap-p2">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={index === current}
            onClick={() => select(index)}
            className={[
              "h-8 rounded-r2 px-p4 text-r12 transition-colors",
              index === current
                ? "bg-(--skools-interactive-active-bg) text-(--skools-text-primary) font-medium"
                : "text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) hover:text-(--skools-text-primary)",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-p6">
        {tabs[current].content}
      </div>
    </div>
  );
}
