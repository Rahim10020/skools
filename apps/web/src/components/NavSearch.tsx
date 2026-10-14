import { useEffect, useRef } from "react";
import SearchIcon from "./icons/SearchIcon";

/**
 * Recherche rapide des pages (design EPL : champ h-7 + chip ⌘F).
 * Ctrl+F focalise le champ (hors saisie en cours), Échap vide et perd le focus.
 */
export function NavSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex items-center bg-(--skools-elevated-bg) border-[0.8px] border-(--skools-border-subtle) rounded-r2 pl-p2 pr-1.5 h-7 text-r12 min-w-0">
      <div className="flex items-center gap-p2 min-w-0 flex-1">
        <SearchIcon className="size-4 shrink-0" />
        <input
          ref={inputRef}
          type="search"
          role="searchbox"
          aria-label="Filtrer les pages"
          placeholder="Recherche rapide"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && value) {
              onChange("");
              inputRef.current?.blur();
            }
          }}
          className="h-full w-full bg-transparent outline-none border-none placeholder:text-(--skools-text-muted) placeholder:tracking-wider tracking-wider text-(--skools-text-primary) [&::-webkit-search-cancel-button]:hidden"
        />
      </div>
      <div
        aria-hidden="true"
        className="flex border-[0.8px] border-(--skools-border-subtle) w-6 uppercase rounded-[6px] text-r10 px-[7px] items-center justify-center text-(--skools-text-muted) select-none shrink-0"
      >
        ⌘F
      </div>
    </div>
  );
}
