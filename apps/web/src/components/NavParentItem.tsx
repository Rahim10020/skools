import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { SidebarNavParent } from "./layout/sidebar-nav";
import { Icon } from "./icons/Icon";
import { FlyoutPanel } from "./FlyoutPanel";
import { ChevronDownwardIcon } from "./icons/ChevronDownwardIcon";

const FLYOUT_CLOSE_MS = 150;

function isChildActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

/**
 * Entrée parente (flyout façon EPL) : survol → panneau des sous-pages,
 * clic → première sous-page accessible, drawer mobile → sous-liste inline.
 */
export function NavParentItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: SidebarNavParent;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(() =>
    item.children.some((child) => isChildActive(pathname, child.to)),
  );
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const children = item.children;
  const active = children.some((child) => isChildActive(pathname, child.to));
  const first = children[0];

  const cancelClose = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimeout.current = setTimeout(() => setFlyoutOpen(false), FLYOUT_CLOSE_MS);
  };

  const handleClick = () => {
    // Desktop : navigation directe. Mobile (drawer tactile) : sous-liste inline.
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setFlyoutOpen(false);
      onNavigate?.();
      navigate(first.to);
    } else {
      setMobileOpen((v) => !v);
    }
  };

  const row = (
    <div
      ref={triggerRef}
      onMouseEnter={() => {
        cancelClose();
        setFlyoutOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") setFlyoutOpen(false);
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={flyoutOpen || mobileOpen}
        aria-haspopup="menu"
        aria-label={`${item.label} — ${children.length} sous-pages`}
        className={[
          "group flex w-full items-center gap-p2 h-8 rounded-r2 px-p2 text-r12 transition-colors",
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
          className={["truncate flex-1 min-w-0 text-left", collapsed ? "lg:hidden" : ""]
            .filter(Boolean)
            .join(" ")}
        >
          {item.label}
        </span>
        <ChevronDownwardIcon
          className={[
            "size-4 shrink-0 transition-transform duration-200",
            collapsed ? "lg:hidden" : "",
            flyoutOpen || mobileOpen ? "" : "-rotate-90",
          ]
            .filter(Boolean)
            .join(" ")}
        />
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
        open={flyoutOpen}
        onOpenChange={setFlyoutOpen}
        onNavigate={onNavigate}
      />
      {!collapsed && mobileOpen && (
        <div className="mt-p1 flex flex-col gap-p1 lg:hidden">
          {children.map((child) => {
            const childActive = isChildActive(pathname, child.to);
            return (
              <Link
                key={child.to}
                to={child.to}
                aria-current={childActive ? "page" : undefined}
                onClick={onNavigate}
                className={[
                  "flex items-center gap-p2 h-8 rounded-r2 pl-p8 pr-p2 text-r12 transition-colors",
                  childActive
                    ? "bg-(--skools-interactive-active-bg) text-(--skools-text-primary) font-medium"
                    : "text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) hover:text-(--skools-text-primary)",
                ].join(" ")}
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
