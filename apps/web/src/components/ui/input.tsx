import { useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { DateIcon } from "../icons/DateIcon";
import { EyeIcon } from "../icons/EyeIcon";
import { EyeSlashIcon } from "../icons/EyeSlashIcon";
import { HelperText, IconBox, RequiredDot } from "./input-shared";
import { INPUT_BASE, getBg } from "./input-tokens";
import { Select, type SelectOption } from "./select";

export type InputVariant =
  | "simple"
  | "iconed"
  | "select"
  | "date"
  | "datetime-local"
  | "texted"
  | "password";

type BaseInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "children" | "type" | "onChange" | "value" | "defaultValue"
>;

export type InputProps = BaseInputProps & {
  variant?: InputVariant;
  label?: string;
  value?: string | number;
  defaultValue?: string | number;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  helperText?: string;
  loading?: boolean;
  selectOptions?: SelectOption[];
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  disableSelectFilter?: boolean;
  disableSelectSearch?: boolean;
  className?: string;
  error?: boolean;
  required?: boolean;
};

function useSyncedState(externalValue: string | number | undefined, initial = "") {
  const [internal, setInternal] = useState(
    externalValue !== undefined ? `${externalValue}` : initial,
  );
  const [prevExternal, setPrevExternal] = useState(externalValue);
  // Ajustement pendant le rendu (pattern React recommandé pour synchroniser un état local sur une prop).
  if (externalValue !== prevExternal) {
    setPrevExternal(externalValue);
    setInternal(externalValue !== undefined ? `${externalValue}` : initial);
  }
  return [internal, setInternal] as const;
}

export function Input({
  variant = "simple",
  label = "Label",
  value,
  defaultValue,
  leftIcon,
  rightIcon,
  helperText,
  selectOptions = [],
  onChange,
  onSearch,
  disableSelectFilter,
  disableSelectSearch,
  loading,
  className,
  error = false,
  required = false,
  ...rest
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [dateValue, setDateValue] = useSyncedState(
    value ?? (typeof defaultValue === "string" || typeof defaultValue === "number" ? defaultValue : undefined),
  );
  const dateRef = useRef<HTMLInputElement>(null);
  const openDatePicker = () => {
    const input = dateRef.current;
    if (!input || input.disabled) return;
    input.focus();
    if (typeof input.showPicker === "function") input.showPicker();
  };

  const isError = error;
  const bg = getBg(isError);

  if (variant === "texted") {
    return (
      <div className={["flex w-full flex-col items-start gap-(--spacing-p1)", className].filter(Boolean).join(" ")}>
        <div className="relative w-full">
          {required && <RequiredDot />}
          <input
            type="text"
            placeholder={label}
            value={value !== undefined ? value : undefined}
            defaultValue={value === undefined ? defaultValue : undefined}
            onChange={(e) => onChange?.(e.target.value)}
            className={[INPUT_BASE, "px-(--spacing-p4)", "placeholder:text-(--skools-text-muted)", "focus:placeholder-transparent", bg].join(" ")}
            {...rest}
          />
        </div>
        {helperText && <HelperText>{helperText}</HelperText>}
      </div>
    );
  }

  if (variant === "password") {
    return (
      <div
        className={["relative", INPUT_BASE, "px-(--spacing-p3) pl-(--spacing-p4) gap-0", bg, className]
          .filter(Boolean)
          .join(" ")}
      >
        {required && <RequiredDot />}
        <input
          type={showPassword ? "text" : "password"}
          placeholder={label}
          value={value !== undefined ? value : undefined}
          defaultValue={value === undefined ? defaultValue : undefined}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 h-full bg-transparent outline-none text-r14 placeholder:text-(--skools-text-muted) focus:placeholder-transparent min-w-0"
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShowPassword((p) => !p)}
          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="flex shrink-0 items-center justify-center size-(--size-s5) text-(--black-30) cursor-pointer"
        >
          {rightIcon ?? (showPassword ? <EyeSlashIcon className="size-full" /> : <EyeIcon className="size-full" />)}
        </button>
      </div>
    );
  }

  if (variant === "select") {
    return (
      <Select
        label={label}
        options={selectOptions}
        disableFilter={disableSelectFilter}
        disableSearch={disableSelectSearch}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onSearch={onSearch}
        disabled={rest.disabled}
        required={required}
        error={isError}
        className={className}
        loading={loading}
        rightIcon={rightIcon}
        name={rest.name}
        id={rest.id}
      />
    );
  }

  if (variant === "date" || variant === "datetime-local") {
    const hasDateValue = dateValue !== "";

    return (
      <div
        className={["relative", INPUT_BASE, "px-(--spacing-p3)", "gap-(--spacing-p1)", "cursor-pointer", bg, className]
          .filter(Boolean)
          .join(" ")}
        onClick={openDatePicker}
      >
        {required && <RequiredDot />}

        <div className="flex flex-1 items-center justify-between pointer-events-none min-w-0">
          <span
            className={[
              "text-r14 truncate",
              hasDateValue ? "text-(--skools-text-primary)" : "text-(--skools-text-muted)",
            ].join(" ")}
          >
            {hasDateValue ? dateValue : label}
          </span>

          <IconBox>{rightIcon ?? <DateIcon className="size-full" />}</IconBox>
        </div>

        <input
          ref={dateRef}
          type={variant}
          value={dateValue}
          onChange={(e) => {
            setDateValue(e.target.value);
            onChange?.(e.target.value);
          }}
          name={rest.name}
          id={rest.id}
          disabled={rest.disabled}
          required={required}
          aria-label={label}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    );
  }

  const padding = variant === "iconed" ? "px-(--spacing-p3)" : "px-(--spacing-p4)";

  return (
    <div
      className={[
        "relative",
        INPUT_BASE,
        padding,
        "gap-(--spacing-p1)",
        bg,
        isError ? "text-(--common-red) border border-(--common-red) bg-(--common-red-5)" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {required && <RequiredDot />}
      {variant === "iconed" && leftIcon && <IconBox>{leftIcon}</IconBox>}

      <input
        type="text"
        placeholder={label}
        value={value !== undefined ? value : undefined}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={(e) => onChange?.(e.target.value)}
        className={[
          "flex-1 h-full bg-transparent outline-none text-r14 placeholder:text-(--skools-text-muted) focus:placeholder-transparent min-w-0",
          isError ? "placeholder:text-(--common-red) text-(--common-red)" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
    </div>
  );
}
