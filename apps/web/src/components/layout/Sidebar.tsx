import { ROLES } from "../../lib/roles";
import { API } from "../../lib/api-endpoints";
import { ROUTES } from "../../lib/routes";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SIDEBAR_NAV, type SidebarNavItem } from "./sidebar-nav";
import { useAuthStore } from "../../stores/auth-store";
import { requestServerLogout } from "../../lib/api";
import api from "../../lib/api";
import { canAccess, roleLabel } from "../../lib/permissions";
import { Avatar } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { IconButton } from "../ui/icon-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ThemeToggle } from "../ThemeToggle";
import { Wordmark } from "../Wordmark";
import { ActiveYearSelector } from "../ActiveYearSelector";
import { ChildSelector } from "../ChildSelector";
import { NavSearch } from "../NavSearch";
import { normalizeText } from "../../lib/text";
import { NotificationsBell } from "../../features/notifications/NotificationsBell";
import { Icon } from "../icons/Icon";
import { ChevronBackIcon } from "../icons/ChevronBackIcon";
import { ChevronDownwardIcon } from "../icons/ChevronDownwardIcon";
import { LogOutIcon } from "../icons/LogOutIcon";
import { XIcon } from "../icons/XIcon";
import ProfilIcon from "../icons/ProfilIcon";
import SettingsNavIcon from "../icons/SettingsNavIcon";
import { BrandLogo } from "../BrandLogo";

const COLLAPSED_KEY = "skools-sidebar-collapsed";
const OPEN_GROUPS_KEY = "skools-sidebar-open";

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

/**
 * Le repli ne s'applique qu'au desktop (`lg:`) : sur mobile la sidebar
 * est toujours un drawer pleine largeur avec libellés.
 */
function NavItemLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: SidebarNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const active = pathname === item.to || pathname.startsWith(`${item.to}/`);

  const link = (
    <Link
      to={item.to}
      data-active={active}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={[
        "group flex items-center gap-p2 h-8 rounded-r2 px-p2 text-r12 transition-colors",
        collapsed ? "lg:justify-center" : "",
        active
          ? "bg-(--skools-interactive-active-bg) text-(--skools-text-primary) font-medium"
          : "text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) hover:text-(--skools-text-primary)",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon component={item.icon} size={18} className="shrink-0" />
      <span
        className={["truncate", collapsed ? "lg:hidden" : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {item.label}
      </span>
    </Link>
  );

  if (!collapsed) return link;
  return (
    <>
      <span className="lg:hidden">{link}</span>
      <span className="hidden lg:block">
        <Tooltip>
          <TooltipTrigger>{link}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      </span>
    </>
  );
}

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
      <ChevronBackIcon
        className={[
          "size-4 transition-transform",
          collapsed ? "rotate-180" : "",
        ].join(" ")}
      />
    </IconButton>
  );
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const { user, role, establishmentId, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(OPEN_GROUPS_KEY) ?? "{}",
      ) as Record<string, boolean>;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      // Stockage indisponible : le repli reste en mémoire de session.
    }
  }, [collapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(openGroups));
    } catch {
      // Stockage indisponible : l'accordéon reste en mémoire de session.
    }
  }, [openGroups]);

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
  }, []);

  const handleLogout = async () => {
    await requestServerLogout(refreshToken ?? undefined);
    logout();
    onCloseMobile();
    navigate(ROUTES.login);
  };

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Utilisateur";
  // Sans établissement (compte venant de s'inscrire) : navigation réduite.
  // Matrice : on masque les entrées non autorisées, on ne grise jamais.
  const groups = (establishmentId ? SIDEBAR_NAV : SIDEBAR_NAV.slice(0, 1))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(item.to, role)),
    }))
    .filter((group) => group.items.length > 0);
  const bottomItems = BOTTOM_NAV.filter((item) => canAccess(item.to, role));

  // Recherche : filtre insensible aux accents sur les libellés.
  const normalizedQuery = normalizeText(query.trim());
  const searching = normalizedQuery.length > 0;
  const visibleGroups = searching
    ? groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            normalizeText(item.label).includes(normalizedQuery),
          ),
        }))
        .filter((group) => group.items.length > 0)
    : groups;

  const isGroupOpen = (group: {
    title: string;
    defaultOpen?: boolean;
    items: SidebarNavItem[];
  }) => {
    if (searching) return true;
    if (openGroups[group.title] !== undefined) return openGroups[group.title];
    if (group.defaultOpen) return true;
    // Le groupe de la route active est déplié par défaut.
    return group.items.some(
      (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
    );
  };

  const toggleGroup = (title: string, currentlyOpen: boolean) =>
    setOpenGroups((prev) => ({ ...prev, [title]: !currentlyOpen }));

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
          className={[
            "flex items-center h-12 px-p4 justify-between",
            collapsed ? "lg:justify-center lg:px-0" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className={collapsed ? "lg:hidden" : ""}>
            <Wordmark />
          </span>
          <span className={collapsed ? "hidden lg:block" : "hidden"}>
            <BrandLogo />
          </span>
          <span className="hidden lg:block">
            <CollapseButton
              collapsed={collapsed}
              onToggle={() => setCollapsed((v) => !v)}
            />
          </span>
          <span className="lg:hidden">
            <IconButton onClick={onCloseMobile} aria-label="Fermer le menu">
              <XIcon className="size-4" />
            </IconButton>
          </span>
        </div>
        {establishmentName && (
          <p
            title={establishmentName}
            className={[
              "px-p4 pb-p3 -mt-p1 text-r12 text-(--skools-text-muted) truncate",
              collapsed ? "lg:hidden" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {establishmentName}
          </p>
        )}
      </div>

      <nav
        aria-label="Sections"
        className="sidebar-scrollbar flex-1 overflow-y-auto px-p4 py-p4"
      >
        <div
          className={["mb-p3", collapsed ? "lg:hidden" : ""]
            .filter(Boolean)
            .join(" ")}
        >
          <NavSearch value={query} onChange={setQuery} />
        </div>
        {searching && visibleGroups.length === 0 ? (
          <p className="px-p2 py-p4 text-center text-r12 text-(--skools-text-muted)">
            Aucune page pour « {query.trim()} »
          </p>
        ) : (
          visibleGroups.map((group, gi) => {
            const open = collapsed ? true : isGroupOpen(group);
            return (
              <div key={group.title} className={gi > 0 ? "mt-p4" : ""}>
                {collapsed ? (
                  <>
                    <p className="px-p2 mb-p2 text-[11px] font-medium uppercase tracking-wide text-(--skools-text-muted) lg:hidden">
                      {group.title}
                    </p>
                    {gi > 0 && (
                      <span className="hidden lg:block">
                        <Separator className="mb-p4" />
                      </span>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title, open)}
                    aria-expanded={open}
                    aria-label={`${open ? "Replier" : "Déplier"} ${group.title}`}
                    className="mb-p2 flex w-full items-center justify-between rounded-r2 px-p2 py-p1 text-[11px] font-medium uppercase tracking-wide text-(--skools-text-muted) transition-colors hover:bg-(--skools-interactive-hover-bg) hover:text-(--skools-text-primary)"
                  >
                    <span className="truncate">{group.title}</span>
                    <ChevronDownwardIcon
                      className={[
                        "size-4 shrink-0 transition-transform duration-200",
                        open ? "" : "-rotate-90",
                      ].join(" ")}
                    />
                  </button>
                )}
                {open && (
                  <div className="flex flex-col gap-p1">
                    {group.items.map((item) => (
                      <NavItemLink
                        key={item.to}
                        item={item}
                        collapsed={collapsed}
                        onNavigate={onCloseMobile}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        {bottomItems.length > 0 && (
          <div className="mt-p4">
            <Separator className="mb-p4" />
            <div className="flex flex-col gap-p1">
              {bottomItems.map((item) => (
                <NavItemLink
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

      <div className="border-t border-(--skools-border-subtle) p-p4">
        <div
          className={[
            "flex items-center gap-p2",
            collapsed ? "lg:flex-col lg:justify-center" : "",
          ].join(" ")}
        >
          <Avatar alt={fullName} />
          <div
            className={["flex-1 min-w-0", collapsed ? "lg:hidden" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            <p className="text-m12 text-(--skools-text-primary) truncate">
              {fullName}
            </p>
            {role && (
              <p className="text-r11 text-(--skools-text-muted) truncate">
                {roleLabel(role)}
              </p>
            )}
          </div>
          {role !== ROLES.SUPER_ADMIN && (
            <NotificationsBell collapsed={collapsed} />
          )}
          <ThemeToggle />
        </div>
        <span className={collapsed ? "lg:hidden" : ""}>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-p3 flex w-full items-center gap-p2 rounded-r2 px-p2 h-8 text-r12 text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) hover:text-(--common-red) transition-colors"
          >
            <LogOutIcon className="size-[18px] shrink-0" />
            <span>Déconnexion</span>
          </button>
        </span>
        {collapsed && (
          <span className="hidden lg:mt-p3 lg:flex lg:justify-center">
            <Tooltip>
              <TooltipTrigger>
                <IconButton onClick={handleLogout} aria-label="Déconnexion">
                  <LogOutIcon className="size-4" />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent side="right">Déconnexion</TooltipContent>
            </Tooltip>
          </span>
        )}
      </div>
    </aside>
  );
}
