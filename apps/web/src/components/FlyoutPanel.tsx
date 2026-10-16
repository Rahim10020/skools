import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import type { SidebarNavChild } from "./layout/sidebar-nav";
import { Icon } from "./icons/Icon";
import { Separator } from "./ui/separator";

const SIDE_OFFSET = 12;

/**
 * Panneau flyout : au survol d'une entrée parente, affiche ses
 * sous-pages à droite, en portal (pas d'écrasement du layout).
 * Le minuteur de fermeture est possédé par le parent (`SidebarNavEntry`) :
 * ce panneau ne fait que signaler les entrées/sorties du pointeur.
 * Chevauchement de 2px avec le déclencheur : aucune zone morte à traverser.
 */
export function FlyoutPanel({
  title,
  items,
  triggerRef,
  panelRef,
  open,
  onHoverEnter,
  onHoverLeave,
  onSelect,
}: {
  title: string;
  items: SidebarNavChild[];
  triggerRef: React.RefObject<HTMLElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
  onSelect: () => void;
}) {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const contentRef = panelRef ?? fallbackRef;
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return;
    const place = () => {
      const trigger = triggerRef.current!.getBoundingClientRect();
      const content = contentRef.current!.getBoundingClientRect();
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
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, triggerRef, contentRef, items.length]);

  if (!open) return null;

  return createPortal(
    <div
      ref={contentRef}
      role="menu"
      aria-label={title}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      className="fixed z-50 flex w-50 flex-col gap-p2 rounded-r2 border border-(--skools-border-subtle) bg-(--skools-app-bg) px-p2 py-p2 shadow-md"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="flex flex-col">
        <p className="px-p2 text-[11px] font-medium uppercase tracking-wide text-(--skools-text-muted)">
          {title}
        </p>
        <div className="mt-p2">
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
              onClick={onSelect}
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
