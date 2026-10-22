
import { forwardRef, useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FieldWrapper({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="rule-label"
        >
          {label}
          {required ? <span className="ml-0.5 text-[var(--color-danger)]">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  containerClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, leading, trailing, className, containerClassName, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrapper
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={inputId}
      className={containerClassName}
    >
      <div className="field-shell" data-invalid={Boolean(error)}>
        {leading ? <span className="shrink-0 text-muted">{leading}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full bg-transparent text-ink outline-none placeholder:text-muted/70",
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {trailing ? <span className="shrink-0 text-muted">{trailing}</span> : null}
      </div>
    </FieldWrapper>
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrapper
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={inputId}
    >
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          "field-shell min-h-24 resize-y leading-relaxed",
          error && "border-[var(--color-danger)]",
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldWrapper>
  );
});

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  containerClassName?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, className, containerClassName, id, children, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrapper
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={inputId}
      className={containerClassName}
    >
      <div className="field-shell" data-invalid={Boolean(error)}>
        <select
          ref={ref}
          id={inputId}
          className={cn("w-full appearance-none bg-transparent text-ink outline-none", className)}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {children}
        </select>
        <span aria-hidden className="pointer-events-none shrink-0 text-muted">
          ▾
        </span>
      </div>
    </FieldWrapper>
  );
});
