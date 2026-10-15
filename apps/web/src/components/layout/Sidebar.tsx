import { ROLES } from "../../lib/roles";
import { API } from "../../lib/api-endpoints";
import { ROUTES } from "../../lib/routes";
import { cx } from "../../lib/cx";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  SIDEBAR_ENTRIES,
  isNavParent,
  type SidebarNavEntry,
  type SidebarNavItem,
} from "./sidebar-nav";
import { SidebarNavLink } from "./SidebarNavLink";
import { SidebarFooter } from "./SidebarFooter";
import { NavParentItem } from "../NavParentItem";
import { useAuthStore } from "../../stores/auth-store";
import api from "../../lib/api";
import { canAccess } from "../../lib/permissions";
import { Separator } from "../ui/separator";
import { IconButton } from "../ui/icon-button";
import { Wordmark } from "../Wordmark";
import { ActiveYearSelector } from "../ActiveYearSelector";
import { ChildSelector } from "../ChildSelector";
import { NavSearch } from "../NavSearch";
import { normalizeText } from "../../lib/text";
import { DoubleCaretIcon } from "../icons/DoubleCaretIcon";
import { XIcon } from "../icons/XIcon";
import ProfilIcon from "../icons/ProfilIcon";
import SettingsNavIcon from "../icons/SettingsNavIcon";
import { useLocalStorageFlag } from "../../hooks/use-local-storage";

const COLLAPSED_KEY = "skools-sidebar-collapsed";

interface MeEstablishments {
  establishments: Array<{
    role: string;
    establishment: { id: string; name: string };
  }>;
}

/** Entrées de bas de sidebar (matrice : Profil partout, Paramètres restreint). */
const BOTTOM_NAV: SidebarNavItem[] = [
  { to: ROUTES.settings, label: "Paramètres", icon: SettingsNavIcon },
  { to: ROUTES.profil, label: "Profil", icon: ProfilIcon },
];

function CollapseButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <IconButton
      onClick={onToggle}
      aria-label={
        collapsed ? "Déplier la barre latérale" : "Replier la barre latérale"
      }
      title={collapsed ? "Déplier (Ctrl+B)" : "Replier (Ctrl+B)"}
    >
      <DoubleCaretIcon
        className={cx("size-4 transition-transform", collapsed && "rotate-180")}
      />
    </IconButton>
  );
}

/**
 * Filtre générique : garde les feuilles vérifiant `keepLeaf`, les parents
 * avec au moins un enfant gardé (ou vérifiant `keepParentLabel` eux-mêmes).
 */
function pruneEntries(
  entries: SidebarNavEntry[],
  keepLeaf: (item: SidebarNavItem) => boolean,
  keepParentLabel: (label: string) => boolean,
): SidebarNavEntry[] {
  return entries.flatMap((entry): SidebarNavEntry[] => {
    if (!isNavParent(entry)) return keepLeaf(entry) ? [entry] : [];
    const children = entry.children.filter(keepLeaf);
    if (children.length > 0) return [{ ...entry, children }];
    return keepParentLabel(entry.label) ? [entry] : [];
  });
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const [collapsed, setCollapsed] = useLocalStorageFlag(COLLAPSED_KEY);
  const { role, establishmentId } = useAuthStore();
  const [query, setQuery] = useState("");

  // Repli au clavier (desktop uniquement).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        if (window.matchMedia("(min-width: 1024px)").matches) {
          event.preventDefault();
          setCollapsed((v) => !v);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setCollapsed]);

  // Sans établissement (compte venant de s'inscrire) : Vue d'ensemble seule.
  // Matrice : on masque les entrées non autorisées, on ne grise jamais.
  const entries = establishmentId
    ? pruneEntries(
        SIDEBAR_ENTRIES,
        (item) => canAccess(item.to, role),
        () => false,
      )
    : pruneEntries(
        SIDEBAR_ENTRIES.slice(0, 1),
        (item) => canAccess(item.to, role),
        () => false,
      );
  const bottomItems = BOTTOM_NAV.filter((item) => canAccess(item.to, role));
  // Recherche : filtre insensible aux accents sur libellés + enfants.
  const normalizedQuery = normalizeText(query.trim());
  const searching = normalizedQuery.length > 0;
  const matches = (label: string) =>
    normalizeText(label).includes(normalizedQuery);
  const visibleEntries = searching
    ? pruneEntries(entries, (item) => matches(item.label), matches)
    : entries;
  const hasResults = visibleEntries.length > 0;

  function renderEntry(entry: SidebarNavEntry) {
    // Parent à un seul enfant visible : lien direct vers l'enfant.
    if (isNavParent(entry) && entry.children.length === 1) {
      const [only] = entry.children;
      return (
        <SidebarNavLink
          key={only.to}
          item={only}
          collapsed={collapsed}
          onNavigate={onCloseMobile}
        />
      );
    }
    if (isNavParent(entry)) {
      return (
        <NavParentItem
          key={entry.label}
          item={entry}
          collapsed={collapsed}
          onNavigate={onCloseMobile}
        />
      );
    }
    return (
      <SidebarNavLink
        key={entry.to}
        item={entry}
        collapsed={collapsed}
        onNavigate={onCloseMobile}
      />
    );
  }

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<MeEstablishments>(API.authMe)).data,
  });
  const establishmentName =
    meQuery.data?.establishments.find(
      (e) => e.establishment.id === establishmentId,
    )?.establishment.name ?? null;

  return (
    <aside
      data-slot="sidebar-wrapper"
      aria-label="Navigation principale"
      className={[
        "flex-col shrink-0 bg-(--skools-sidebar-bg) border-r border-(--skools-border-subtle)",
        "fixed inset-y-0 left-0 z-40 flex w-(--size-s58) transition-transform duration-200",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:transition-[width]",
        collapsed ? "lg:w-(--size-s16)" : "lg:w-(--size-s58)",
      ].join(" ")}
    >
      <div className="border-b border-(--skools-border-subtle)">
        <div
          className={cx(
            "flex items-center h-12 px-p4 justify-between",
            collapsed && "lg:justify-center lg:px-0",
          )}
        >
          <span className={cx(collapsed && "lg:hidden")}>
            <Wordmark />
          </span>

          <span className="hidden lg:block">
            <CollapseButton
              collapsed={collapsed}
              onToggle={() => setCollapsed((v) => !v)}
            />
          </span>
          <span className="lg:hidden">
            <IconButton onClick={onCloseMobile} aria-label="Fermer le menu">
              <XIcon className="size-6" />
            </IconButton>
          </span>
        </div>
        {establishmentName && (
          <p
            title={establishmentName}
            className={cx(
              "px-p4 pb-p3 -mt-p1 text-r12 text-(--skools-text-muted) truncate",
              collapsed && "lg:hidden",
            )}
          >
            {establishmentName}
          </p>
        )}
      </div>

      <nav
        aria-label="Sections"
        className="sidebar-scrollbar flex-1 overflow-y-auto px-p4 py-p4"
      >
        <div className={cx("mb-p4", collapsed && "lg:hidden")}>
          <NavSearch value={query} onChange={setQuery} />
        </div>
        {searching && !hasResults ? (
          <p className="px-p2 py-p4 text-center text-r12 text-(--skools-text-muted)">
            Aucune page pour « {query.trim()} »
          </p>
        ) : (
          <div className="flex flex-col gap-p1">
            {visibleEntries.map((entry) => renderEntry(entry))}
          </div>
        )}
        {bottomItems.length > 0 && (
          <div className="mt-p4">
            <Separator className="mb-p4" />
            <div className="flex flex-col gap-p4">
              {bottomItems.map((item) => (
                <SidebarNavLink
                  key={item.to}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onCloseMobile}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      {role === ROLES.PARENT && !collapsed && <ChildSelector />}
      <ActiveYearSelector collapsed={collapsed} />

      <SidebarFooter collapsed={collapsed} onCloseMobile={onCloseMobile} />
    </aside>
  );
}
