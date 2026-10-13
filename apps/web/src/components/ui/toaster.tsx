import { useSyncExternalStore } from "react";
import { XIcon } from "../icons/XIcon";
import { getToastSnapshot, subscribeToast, toast, type ToastState } from "./toast";

const TOAST_STYLES: Record<ToastState, string> = {
  success: "border-emerald-500/35 bg-emerald-500/10 text-emerald-500",
  info: "border-(--common-blue)/35 bg-(--common-blue)/10 text-(--common-blue)",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-500",
  error: "border-(--common-red)/35 bg-(--common-red)/10 text-(--common-red)",
};
/**
 * Bannière inline à monter une fois en haut du contenu (shell Phase 3).
 * Un seul toast à la fois (comportement EPL conservé).
 */
export function Toaster() {
  const current = useSyncExternalStore(subscribeToast, getToastSnapshot, getToastSnapshot);
  const isOpen = !!current;

  return (
    <div
      data-slot="toaster"
      role="status"
      aria-live="polite"
      className={[
        "grid w-full shrink-0 transition-[grid-template-rows,opacity] duration-300 ease-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      ].join(" ")}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={["flex items-center justify-center gap-p2 px-p4 py-p2", current ? TOAST_STYLES[current.state] : TOAST_STYLES.info].join(" ")}>
          <span className="text-sm font-medium text-(--skools-text-primary)">{current?.content}</span>
          <button
            type="button"
            aria-label="Fermer la notification"
            onClick={toast.dismiss}
            className="shrink-0 rounded-full p-p1 text-current transition-colors hover:bg-current/10"
          >
            <XIcon className="size-p4-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
