import type { TextareaHTMLAttributes } from "react";
import { HelperText, RequiredDot } from "./input-shared";
import { getBg } from "./input-tokens";

export type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className" | "children" | "onChange"
> & {
  label?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (value: string) => void;
};

export function Textarea({
  label = "Label",
  helperText,
  error = false,
  required = false,
  className,
  onChange,
  rows = 4,
  ...rest
}: TextareaProps) {
  const bg = getBg(error);

  return (
    <div className={["flex w-full flex-col items-start gap-(--spacing-p1)", className].filter(Boolean).join(" ")}>
      <div className="relative w-full">
        {required && <RequiredDot />}
        <textarea
          placeholder={label}
          aria-label={typeof rest["aria-label"] === "string" ? rest["aria-label"] : label}
          rows={rows}
          onChange={(e) => onChange?.(e.target.value)}
          className={[
            "flex w-full min-h-[96px] rounded-(--radius-r2) text-r14 leading-normal outline-none",
            "px-(--spacing-p4) py-(--spacing-p3)",
            "placeholder:text-(--skools-text-muted) focus:placeholder-transparent",
            "text-(--skools-text-primary)",
            bg,
          ].join(" ")}
          {...rest}
        />
      </div>
      {helperText && <HelperText>{helperText}</HelperText>}
    </div>
  );
}
