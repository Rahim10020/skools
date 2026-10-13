import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLProps,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

interface TooltipContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  delayDuration: number;
  triggerRef: RefObject<HTMLDivElement | null>;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

function useTooltip() {
  const context = useContext(TooltipContext);
  if (!context) throw new Error("Tooltip doit être utilisé dans un TooltipProvider");
  return context;
}

export function Tooltip({
  delayDuration = 0,
  children,
}: {
  delayDuration?: number;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen, delayDuration, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({
  children,
  className,
  ...props
}: HTMLProps<HTMLDivElement>) {
  const { setIsOpen, delayDuration, triggerRef } = useTooltip();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(true), delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(false);
  };

  const handleFocus = () => setIsOpen(true);
  const handleBlur = () => setIsOpen(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      data-slot="tooltip-trigger"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function TooltipContent({
  className,
  sideOffset = 8,
  side = "right",
  children,
  ...props
}: HTMLProps<HTMLDivElement> & {
  sideOffset?: number;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const { isOpen, triggerRef } = useTooltip();
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (side) {
      case "top":
        top = triggerRect.top - contentRect.height - sideOffset;
        left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + sideOffset;
        left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
        break;
      case "left":
        top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
        left = triggerRect.left - contentRect.width - sideOffset;
        break;
      case "right":
        top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
        left = triggerRect.right + sideOffset;
        break;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 0) left = sideOffset;
    if (left + contentRect.width > viewportWidth) left = viewportWidth - contentRect.width - sideOffset;
    if (top < 0) top = sideOffset;
    if (top + contentRect.height > viewportHeight) top = viewportHeight - contentRect.height - sideOffset;

    setPosition({ top, left });
  }, [isOpen, side, sideOffset, triggerRef]);

  // App 100 % cliente (Vite, pas de SSR) : portail direct sur body.
  return createPortal(
    <div
      ref={contentRef}
      data-slot="tooltip-content"
      data-side={side}
      data-state={isOpen ? "open" : "closed"}
      role="tooltip"
      className={[
        "fixed z-[100] w-max max-w-xs items-center justify-center flex gap-1.5 rounded-r2",
        "bg-(--skools-elevated-bg) px-2 min-h-[24px] text-[11px] text-(--skools-text-muted)",
        "border border-(--skools-border-subtle) backdrop-blur-sm pointer-events-none transition-opacity duration-200",
        isOpen ? "opacity-100 visible" : "opacity-0 invisible",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
}
