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
    <div className={className} onClick={disabled ? undefined : open}>
      {children}
    </div>
  );
}

const EXIT_ANIMATION_MS = 200;

export function ModalContent({
  children,
  className,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  labelledBy?: string;
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
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

  if (!shouldRender) return null;

  const overlay = (    <div
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
        tabIndex={-1}
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

export function ModalDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={["text-r14 text-(--skools-text-muted)", className].filter(Boolean).join(" ")}>
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

export function ModalClose({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
} & ComponentProps<"div">) {
  const { close } = useModalContext();
  return (
    <div onClick={close} className={className}>
      {children}
    </div>
  );
}
