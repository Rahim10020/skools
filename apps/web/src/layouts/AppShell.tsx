import { ROLES } from "../lib/roles";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Wordmark } from "../components/Wordmark";
import { ThemeToggle } from "../components/ThemeToggle";
import { NotificationsBell } from "../features/notifications/NotificationsBell";
import { Toaster } from "../components/ui/toaster";
import { useAuthStore } from "../stores/auth-store";

function HamburgerGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = useAuthStore((state) => state.role);

  return (
    <div
      data-slot="skools-root"
      className="min-h-screen flex bg-(--skools-app-bg) text-(--skools-text-primary)"
    >
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:m-p2 focus:rounded-r2 focus:bg-(--skools-sidebar-bg) focus:px-p4 focus:py-p2 focus:text-r14"
      >
        Aller au contenu
      </a>
      {/* Barre mobile uniquement (EPL n'a pas de topbar desktop). */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 flex items-center gap-p3 h-14 px-p4 bg-(--skools-sidebar-bg) border-b border-(--skools-border-subtle)">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={mobileOpen}
          className="flex size-10 items-center justify-center rounded-r2 text-(--skools-icon-muted) hover:bg-(--skools-interactive-hover-bg) hover:text-(--skools-icon-primary)"
        >
          <HamburgerGlyph />
        </button>
        <Wordmark />
        <span className="flex-1" />
        {role !== ROLES.SUPER_ADMIN && <NotificationsBell />}
        <ThemeToggle />
      </header>

      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
        <Toaster />
        <main id="contenu" tabIndex={-1} className="flex-1 w-full max-w-[1280px] mx-auto px-p4 sm:px-p10 pt-p13 pb-p10 outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
