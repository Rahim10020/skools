import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  isNavParent,
  type SidebarNavChild,
  type SidebarNavEntry as SidebarNavEntryType,
  type SidebarNavItem,
  type SidebarNavParent,
} from "./sidebar-nav";
import { cx } from "../../lib/cx";
import { Icon } from "../icons/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FlyoutPanel } from "../FlyoutPanel";

const FLYOUT_CLOSE_MS = 200;

function isRouteActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** Ligne commune feuille / parent : même taille, même état actif. */
function navRowClass(active: boolean, collapsed: boolean) {
  return cx(
    "group flex w-full items-center gap-p2 h-8 rounded-r2 px-p2 text-r14 cursor-pointer transition-colors",
    collapsed && "lg:justify-center",
    active
      ? "bg-(--skools-interactive-active-bg) text-(--skools-text-primary) font-medium"
      : "text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) hover:text-(--skools-text-primary)",
  );
}

function LeafLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: SidebarNavItem | SidebarNavChild;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const active = isRouteActive(pathname, item.to);

  const link = (
    <Link
      to={item.to}
      data-active={active}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={navRowClass(active, collapsed)}
    >
      <Icon component={item.icon} size={18} className="shrink-0" />
      <span className={cx("truncate", collapsed && "lg:hidden")}>
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

function ParentRow({
  item,
  collapsed,
  onNavigate,
}: {
  item: SidebarNavParent;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(() =>
    item.children.some((child) => isRouteActive(pathname, child.to)),
  );
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const children = item.children;
  const active =
    children.some((child) => isRouteActive(pathname, child.to)) || flyoutOpen;

  const cancelClose = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimeout.current = setTimeout(() => {
      if (!pinned) setFlyoutOpen(false);
    }, FLYOUT_CLOSE_MS);
  };

  const close = () => {
    cancelClose();
    setPinned(false);
    setFlyoutOpen(false);
  };

  const handleClick = () => {
    // Mobile (drawer tactile) : sous-liste inline.
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      setMobileOpen((v) => !v);
      return;
    }
    // Desktop : épingle / désépingle le panneau (pas de navigation).
    cancelClose();
    if (flyoutOpen && pinned) {
      close();
    } else {
      setPinned(true);
      setFlyoutOpen(true);
    }
  };

  // Clic extérieur (trigger + panneau) : ferme et désépingle.
  useEffect(() => {
    if (!flyoutOpen) return;
    const closePanel = () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
      setPinned(false);
      setFlyoutOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        closePanel();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [flyoutOpen]);

  const row = (
    <div
      ref={triggerRef}
      onMouseEnter={() => {
        cancelClose();
        setFlyoutOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={flyoutOpen || mobileOpen}
        aria-haspopup="menu"
        aria-label={`${item.label} — ${children.length} sous-pages`}
        className={navRowClass(active, collapsed)}
      >
        <Icon component={item.icon} size={18} className="shrink-0" />
        <span
          className={cx(
            "truncate flex-1 min-w-0 text-left",
            collapsed && "lg:hidden",
          )}
        >
          {item.label}
        </span>
      </button>
    </div>
  );

  return (
    <>
      {collapsed ? (
        <>
          <span className="lg:hidden">{row}</span>
          {/* Desktop replié : le flyout sert de tooltip (titre + options). */}
          <span className="hidden lg:block">{row}</span>
        </>
      ) : (
        row
      )}
      <FlyoutPanel
        title={item.label}
        items={children}
        triggerRef={triggerRef}
        panelRef={panelRef}
        open={flyoutOpen}
        onHoverEnter={cancelClose}
        onHoverLeave={scheduleClose}
        onSelect={() => {
          close();
          onNavigate?.();
        }}
      />
      {!collapsed && mobileOpen && (
        <div className="mt-p2 flex flex-col gap-p2 lg:hidden">
          {children.map((child) => {
            const childActive = isRouteActive(pathname, child.to);
            return (
              <Link
                key={child.to}
                to={child.to}
                aria-current={childActive ? "page" : undefined}
                onClick={onNavigate}
                className={cx(
                  "flex items-center gap-p2 h-8 rounded-r2 pl-p8 pr-p2 text-r12 transition-colors",
                  childActive
                    ? "bg-(--skools-interactive-active-bg) text-(--skools-text-primary) font-medium"
                    : "text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) hover:text-(--skools-text-primary)",
                )}
              >
                <Icon component={child.icon} size={18} className="shrink-0" />
                <span className="truncate">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

/**
 * Entrée unique de la sidebar (feuille ou parent).
 * - Feuille : `<Link>` direct + tooltip en mode replié.
 * - Parent : bouton + flyout desktop, sous-liste inline sur mobile.
 * - Parent à un seul enfant visible : lien direct vers l'enfant.
 */
export function SidebarNavEntry({
  entry,
  collapsed,
  onNavigate,
}: {
  entry: SidebarNavEntryType;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  if (isNavParent(entry)) {
    if (entry.children.length === 1) {
      const [only] = entry.children;
      return (
        <LeafLink item={only} collapsed={collapsed} onNavigate={onNavigate} />
      );
    }
    return (
      <ParentRow item={entry} collapsed={collapsed} onNavigate={onNavigate} />
    );
  }
  return (
    <LeafLink item={entry} collapsed={collapsed} onNavigate={onNavigate} />
  );
}
