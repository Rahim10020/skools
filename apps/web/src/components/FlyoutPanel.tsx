import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import type { SidebarNavChild } from "./layout/sidebar-nav";
import { Icon } from "./icons/Icon";
import { Separator } from "./ui/separator";

const SIDE_OFFSET = 8;

/**
 * Panneau flyout façon EPL : au survol d'une entrée parente, affiche ses
 * sous-pages à droite, en portal (pas d'écrasement du layout).
 * Pont de survol 150 ms : le pointeur peut voyager jusqu'au panneau.
 */
export function FlyoutPanel({
  title,
  items,
  triggerRef,
  open,
  onOpenChange,
  onNavigate,
}: {
  title: string;
  items: SidebarNavChild[];
  triggerRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { pathname } = useLocation();

  const cancelClose = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimeout.current = setTimeout(() => onOpenChange(false), 150);
  };

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const content = contentRef.current.getBoundingClientRect();
    let top = trigger.top + trigger.height / 2 - content.height / 2;
    let left = trigger.right + SIDE_OFFSET;
    if (left + content.width > window.innerWidth) {
      left = window.innerWidth - content.width - SIDE_OFFSET;
    }
    if (left < 0) left = SIDE_OFFSET;
    if (top < 0) top = SIDE_OFFSET;
    if (top + content.height > window.innerHeight) {
      top = window.innerHeight - content.height - SIDE_OFFSET;
    }
    setPosition({ top, left });
  }, [open, triggerRef, items.length]);

  if (!open) return null;

  return createPortal(
    <div
      ref={contentRef}
      role="menu"
      aria-label={title}
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
      className="fixed z-50 flex w-[200px] flex-col gap-p2 rounded-r2 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) px-p2 py-p2 shadow-xl"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="flex flex-col">
        <p className="px-p2 text-[11px] font-medium uppercase tracking-wide text-(--skools-text-muted)">
          {title}
        </p>
        <div className="mt-p1">
          <Separator />
        </div>
      </div>
      <div className="flex flex-col gap-p1">
        {items.map((item) => {
          const active =
            pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              aria-current={active ? "page" : undefined}
              onClick={() => {
                onOpenChange(false);
                onNavigate?.();
              }}
              className={[
                "flex h-8 items-center gap-p2 rounded-r2 px-p2 text-r12 transition-colors",
                active
                  ? "bg-(--skools-interactive-active-bg) text-(--skools-text-primary) font-medium"
                  : "text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) hover:text-(--skools-text-primary)",
              ].join(" ")}
            >
              <Icon component={item.icon} size={18} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
