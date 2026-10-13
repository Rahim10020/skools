import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { INPUT_BASE, getBg } from "./input-tokens";
import { IconBox, RequiredDot } from "./input-shared";
import { ChevronDownwardIcon } from "../icons/ChevronDownwardIcon";
import { LoadingDots } from "./button";

export type SelectOption = { label: string; value: string };

export type SelectProps = {
  label?: string;
  value?: string | number;
  defaultValue?: string | number;
  options?: SelectOption[];
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  disableFilter?: boolean;
  disableSearch?: boolean;
  loading?: boolean;
  className?: string;
  rightIcon?: ReactNode;
  name?: string;
  id?: string;
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function Select({
  label = "Sélectionner",
  value,
  defaultValue,
  options = [],
  onChange,
  onSearch,
  disabled = false,
  required = false,
  error = false,
  disableFilter = false,
  disableSearch = false,
  loading = false,
  className,
  rightIcon,
  name,
  id,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    onSearch?.(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const isControlled = value !== undefined;
  const internalValue = isControlled ? value : defaultValue;

  const selectedOption = useMemo(() => {
    return options.find((o) => o.value === `${internalValue}`);
  }, [options, internalValue]);

  const hasValue =
    internalValue !== undefined && internalValue !== null && `${internalValue}` !== "";
  const displayLabel = selectedOption?.label ?? (hasValue ? `${internalValue}` : label);

  const filteredOptions = useMemo(() => {
    if (!searchQuery || disableFilter) return options;
    return options.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [options, searchQuery, disableFilter]);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const bg = getBg(error);

  return (
    <div ref={containerRef} className={["relative w-full", className].filter(Boolean).join(" ")}>
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
          if (e.key === "Escape") setIsOpen(false);
        }}
        className={[
          INPUT_BASE,
          "px-(--spacing-p3) gap-(--spacing-p1) cursor-pointer select-none transition-all duration-200",
          bg,
          disabled ? "opacity-50 cursor-not-allowed" : "",
          isOpen ? "ring-1 ring-(--black-30)" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {required && <RequiredDot />}

        <div className="flex flex-1 items-center justify-between min-w-0">
          <div
            className={[
              "text-r14 truncate h-full block min-h-4",
              hasValue ? "text-(--skools-text-primary)" : "text-(--skools-text-muted)",
            ].join(" ")}
          >
            {displayLabel}
          </div>

          <IconBox>
            {rightIcon ?? (
              <ChevronDownwardIcon
                className={["size-full transition-transform duration-200", isOpen ? "rotate-180" : ""].join(" ")}
              />
            )}
          </IconBox>
        </div>
      </div>

      {isOpen && (
        <div className="bg-(--skools-sidebar-bg) border border-(--skools-border-subtle) rounded-(--radius-r2) h-max flex absolute top-full left-0 z-50 w-full mt-1 shadow-sm animate-slide-up-fade">
          <div className="bg-(--skools-elevated-bg)/50 w-full overflow-hidden rounded-(--radius-r2)">
            {!disableSearch && (
              <div className="p-2 border-b border-(--skools-border-subtle)">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  aria-label="Rechercher dans la liste"
                  className="w-full px-3 py-1.5 text-r14 bg-(--skools-elevated-bg) rounded-(--radius-r1) outline-none placeholder:text-(--skools-text-muted)"
                />
              </div>
            )}

            <div className="max-h-60 overflow-y-auto scrollbar-hide" role="listbox">
              {filteredOptions.length > 0 && !loading ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={internalValue === option.value}
                    onClick={() => handleSelect(option.value)}
                    className={[
                      "px-4 py-1 text-r14 cursor-pointer hover:bg-(--skools-interactive-hover-bg) transition-colors",
                      internalValue === option.value
                        ? "bg-(--primary-5) text-(--skools-text-primary) font-medium"
                        : "text-(--skools-text-muted)",
                    ].join(" ")}
                  >
                    {option.label}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-r14 flex items-center justify-center text-(--skools-text-muted) text-center">
                  {loading ? <LoadingDots /> : "Aucun résultat"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input type="hidden" name={name} id={id} value={internalValue ?? ""} required={required} readOnly />
    </div>
  );
}
