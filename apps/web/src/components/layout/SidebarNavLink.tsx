import { Link, useLocation } from "react-router-dom";
import type { SidebarNavItem } from "./sidebar-nav";
import { cx } from "../../lib/cx";
import { Icon } from "../icons/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

/**
 * Lien de navigation feuille (mode replié desktop : tooltip à droite).
 * Le repli ne s'applique qu'au desktop (`lg:`) : sur mobile la sidebar
 * est toujours un drawer pleine largeur avec libellés.
 */
export function SidebarNavLink({
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
      className={cx(
        "group flex items-center gap-p2 h-8 rounded-r2 px-p2 text-r14 cursor-pointer transition-colors",
        collapsed && "lg:justify-center",
        active
          ? "bg-(--skools-interactive-active-bg) text-(--skools-text-primary) font-medium"
          : "text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) hover:text-(--skools-text-primary)",
      )}
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
