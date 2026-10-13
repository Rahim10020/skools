type SkeletonProps = {
  className?: string;
  count?: number;
};

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, idx) => (
        <div
          key={idx}
          className={["skeleton-shimmer relative overflow-hidden", className]
            .filter(Boolean)
            .join(" ")}
        />
      ))}
    </>
  );
}
