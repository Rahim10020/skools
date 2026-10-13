export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-p2 select-none" aria-label="Skools">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-r2 bg-(--primary) text-sb16 text-(--common-white)"
      >
        S
      </span>
      {!compact && (
        <span className="text-sb18 text-(--skools-text-primary)">Skools</span>
      )}
    </span>
  );
}
