import type { ReactNode } from "react";
import { BrandLogo } from "../../../components/BrandLogo";
import { Wordmark } from "../../../components/Wordmark";

/**
 * Layout auth Skools
 * colonne formulaire 360px + panneau de marque desktop, sans i18n ni illustration externe.
 * Source unique des logos : BrandLogo 64 (mobile + panneau) / 32 (topbar droite).
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-(--skools-app-bg) text-(--skools-text-primary) overflow-x-hidden">
      {/* Topbar mobile uniquement */}
      <div className="lg:hidden sticky top-0 z-20 flex items-center justify-center w-full bg-(--skools-elevated-bg) px-5 py-4">
        <BrandLogo size={64} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Colonne formulaire */}
        <div className="relative flex flex-col flex-1 px-5 py-6 pb-28 md:px-16 md:pb-6 lg:px-24">
          <main className="flex flex-col justify-center flex-1 w-full py-12 mx-auto sm:max-w-[360px]">
            {children}
          </main>

          <footer className="absolute bottom-6 left-5 right-5 text-center md:static md:mt-auto md:pt-6 md:left-auto md:right-auto">
            <p className="text-r12 text-(--skools-text-muted) leading-relaxed">
              En continuant, vous acceptez nos{" "}
              <span className="underline cursor-pointer">
                conditions d'utilisation
              </span>{" "}
              et notre{" "}
              <span className="underline cursor-pointer">
                politique de confidentialité
              </span>
              .
            </p>
          </footer>
        </div>

        {/* Panneau de marque desktop */}
        <div className="hidden lg:flex flex-col flex-1 p-4 bg-(--skools-elevated-bg)">
          <div className="flex items-center px-4 py-3 mb-4">
            <Wordmark />
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-p5 rounded-(--radius-r1) px-p10 text-center"></div>
        </div>
      </div>
    </div>
  );
}
