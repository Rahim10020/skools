/**
 * Logo officiel Skools — source unique (public/logo-32.svg, public/logo-64.svg).
 * 32px : sidebar, header mobile. 64px : pages auth, panneau de marque.
 */
export function BrandLogo({
  size = 32,
  className,
}: {
  size?: 32 | 64;
  className?: string;
}) {
  const src = size === 64 ? "/logo-64.svg" : "/logo-32.svg";
  const dimension = size === 64 ? "size-16" : "size-8";
  return (
    <img
      src={src}
      alt="Skools"
      width={size}
      height={size}
      className={[dimension, "shrink-0", className].filter(Boolean).join(" ")}
    />
  );
}
