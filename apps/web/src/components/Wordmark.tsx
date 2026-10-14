import { BrandLogo } from "./BrandLogo";

/**
 * Wordmark = BrandLogo officiel + nom SVG (public/skools-text.svg).
 * `dark:invert` : le tracé est encre primary (#0E0637), inversé en mode sombre.
 */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-p2 select-none" aria-label="Skools">
      <BrandLogo size={32} />
      {!compact && (
        <img
          src="/skools-text.svg"
          alt=""
          aria-hidden="true"
          className="h-5 w-auto shrink-0 dark:invert"
        />
      )}
    </span>
  );
}
