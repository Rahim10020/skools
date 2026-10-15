import { useRef } from "react";
import { CheckIcon } from "../icons/CheckIcon";

export type CheckboxProps = {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
  label?: string;
  ["aria-label"]?: string;
};

export function Checkbox({
  checked = false,
  indeterminate = false,
  onChange,
  className,
  disabled,
  id,
  label,
  ...rest
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const active = checked || indeterminate;
  const base =
    "flex size-[16px] shrink-0 items-center justify-center transition-colors duration-150";

  const visual = active
    ? "rounded-(--radius-r1) bg-(--primary) text-(--common-white)"
    : "rounded-(--radius-r1) border border-(--skools-border-subtle) bg-transparent";

  return (
    <label
      htmlFor={id}
      className={["relative inline-flex shrink-0 items-center gap-p2", disabled ? "opacity-50" : "cursor-pointer"]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          ref={(node) => {
            inputRef.current = node;
            if (node) node.indeterminate = indeterminate && !checked;
          }}
          type="checkbox"
          disabled={disabled}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          {...rest}
        />
        <span className={[base, visual, className].filter(Boolean).join(" ")}>
          {active && <CheckIcon className="size-[12px]" />}
        </span>
      </span>
      {label && (
        <span className="text-r14 text-(--skools-text-primary) select-none">
          {label}
        </span>
      )}
    </label>
  );
}
