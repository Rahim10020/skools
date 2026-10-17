import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ModalSize = "sm" | "md" | "lg";

interface ModalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  size: ModalSize;
}

interface ModalRootProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: ModalSize;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "w-[calc(100%-24px)] sm:w-[400px]",
  md: "w-[calc(100%-18px)] sm:w-[650px]",
  lg: "w-[calc(100%-24px)] sm:w-[800px]",
};

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) throw new Error("Les composants Modal doivent être utilisés dans un Modal.Root");
  return context;
}

export function ModalRoot({ children, open, defaultOpen = false, onOpenChange, size = "md" }: ModalRootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const setIsOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const value: ModalContextValue = {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(!isOpen),
    size,
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function ModalTrigger({
  children,
  className,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { open } = useModalContext();
  return (
    <button
      type="button"
      className={["text-left", className].filter(Boolean).join(" ")}
      disabled={disabled}
      onClick={disabled ? undefined : open}
    >
      {children}
    </button>
  );
}

const EXIT_ANIMATION_MS = 200;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Compteur global : empile les modals sans restaurer le scroll au premier fermé. */
let scrollLockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    savedOverflow = document.body.style.overflow;
    savedPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
  scrollLockCount += 1;
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = savedOverflow;
    document.body.style.paddingRight = savedPaddingRight;
  }
}

export function ModalContent({
  children,
  className,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  labelledBy,
  describedBy,
}: {
  children: ReactNode;
  className?: string;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  labelledBy?: string;
  describedBy?: string;
}) {
  const { isOpen, close, size } = useModalContext();
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  // Ajustement pendant le rendu : synchronise l'état d'affichage sur la prop `open`.
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
    }
  }

  // Le minuteur de sortie vit dans un effet : setState uniquement en callback (autorisé).
  useEffect(() => {
    if (!isClosing) return;
    const timer = setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
    }, EXIT_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [isClosing]);

  useEffect(() => {
    if (!shouldRender) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    contentRef.current?.focus({ preventScroll: true });
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [shouldRender]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape, close]);

  // Piège de focus : empêche la tabulation de sortir du modal.
  const handleTabTrap = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const node = contentRef.current;
    if (!node) return;
    const focusables = Array.from(
      node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => el.offsetParent !== null);
    if (focusables.length === 0) {
      event.preventDefault();
      node.focus({ preventScroll: true });
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === node)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!shouldRender) return null;

  const overlay = (
    <div
      ref={overlayRef}
      onMouseDown={(e) => {
        if (closeOnOutsideClick && e.target === overlayRef.current) close();
      }}
      className={[
        "bg-(--popup-bg) backdrop-blur-xs popup-background-animation fixed inset-0 z-999 flex items-center justify-center",
        isClosing ? "exit" : "enter",
      ].join(" ")}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={handleTabTrap}
        className={[
          "popup-content-ref flex flex-col gap-3 bg-(--skools-sidebar-bg) text-(--skools-text-primary)",
          "rounded-r4 p-8 shadow-xl",
          "max-h-[90vh] overflow-y-auto",
          isClosing ? "exit" : "enter",
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

export function ModalHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function ModalTitle({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2 id={id} className={["text-sb20 text-(--skools-text-primary)", className].filter(Boolean).join(" ")}>
      {children}
    </h2>
  );
}

export function ModalDescription({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <p id={id} className={["text-r14 text-(--skools-text-muted)", className].filter(Boolean).join(" ")}>
      {children}
    </p>
  );
}

export function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={["flex items-center justify-end gap-3 pt-4", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

/**
 * Zone cliquable de fermeture. Rend un `<span>` (et non un bouton) car les usages
 * enveloppent déjà un `<Button>` (élément focusable au clavier).
 */
export function ModalClose({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
} & ComponentProps<"span">) {
  const { close } = useModalContext();
  return (
    <span onClick={close} className={className}>
      {children}
    </span>
  );
}
