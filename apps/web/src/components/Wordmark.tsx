import { BrandLogo } from "./BrandLogo";

/** Wordmark = BrandLogo officiel + nom. Plus de badge CSS : logo SVG unique. */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-p2 select-none" aria-label="Skools">
      <BrandLogo size={32} />
      {!compact && (
        <span className="text-sb18 text-(--skools-text-primary)">Skools</span>
      )}
    </span>
  );
}
