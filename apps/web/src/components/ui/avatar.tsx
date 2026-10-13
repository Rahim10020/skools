import type { ComponentProps, JSX } from "react";

export function Avatar({
  className,
  info = true,
  ...rest
}: ComponentProps<"img"> & { info?: boolean }) {
  return (
    <div
      className={[
        "relative size-7 min-w-7 flex rounded-r2 bg-(--skools-elevated-bg) items-center justify-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!rest.src ? (
        <AvatarFallback alt={rest.alt} />
      ) : (
        <img className="w-full h-full object-cover rounded-r2" src={rest.src} {...rest} />
      )}
      <span
        className={[
          "block size-1.5 rounded-full bg-(--common-blue) absolute bottom-[1px] right-[1px]",
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
