import type { ComponentProps, JSX } from "react";

export function Avatar({
  className,
  info = true,
  ...rest
}: ComponentProps<"img"> & { info?: boolean }) {
  return (
    <div
      className={[
        "relative size-10 min-w-9 flex rounded-r2 bg-(--skools-elevated-bg) items-center justify-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!rest.src ? (
        <AvatarFallback alt={rest.alt} />
      ) : (
        <img
          className="w-full h-full object-cover rounded-r2"
          src={rest.src}
          {...rest}
        />
      )}
      <span
        className={[
          "block size-2 rounded-full bg-(--common-blue) absolute bottom-px right-px",
          !info ? "hidden" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );
}

function AvatarFallback({ alt = "User" }: { alt?: string }): JSX.Element {
  return <span className="block uppercase font-bold text-dp14">{alt[0]}</span>;
}
