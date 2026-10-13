import type { ReactNode } from "react";

export type ToastState = "success" | "info" | "warning" | "error";

type ToastPayload = {
  id: number;
  content: ReactNode;
  state: ToastState;
};

type ToastOptions = {
  /** Durée d'affichage en ms (défaut 5000, 0 = persistant jusqu'à dismiss). */
  duration?: number;
};

type ToastListener = () => void;

let currentToast: ToastPayload | null = null;
let toastId = 0;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<ToastListener>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return currentToast;
}

function clearDismissTimer() {
  if (!dismissTimer) return;
  clearTimeout(dismissTimer);
  dismissTimer = null;
}

function showToast(state: ToastState, content: ReactNode, options: ToastOptions = {}) {
  clearDismissTimer();
  currentToast = { id: ++toastId, content, state };
  emit();

  const duration = options.duration ?? 5000;
  if (duration > 0) {
    dismissTimer = setTimeout(() => {
      toast.dismiss();
    }, duration);
  }
}

/** API impérative — remplace les `alert()` des pages actuelles. */
export const toast = {
  success: (content: ReactNode, options?: ToastOptions) => showToast("success", content, options),
  info: (content: ReactNode, options?: ToastOptions) => showToast("info", content, options),
  warning: (content: ReactNode, options?: ToastOptions) => showToast("warning", content, options),
  error: (content: ReactNode, options?: ToastOptions) => showToast("error", content, options),
  dismiss: () => {
    clearDismissTimer();
    currentToast = null;
    emit();
  },
};

export function subscribeToast(listener: ToastListener) {
  return subscribe(listener);
}

export function getToastSnapshot() {
  return getSnapshot();
}
