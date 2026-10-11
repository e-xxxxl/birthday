
import { forwardRef, useId, useState } from "react";
import { FieldWrapper } from "./Field";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  containerClassName?: string;
};

/** Password field with a show/hide toggle. Visual twin of `Input`, minus the leading/trailing slots. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { label, hint, error, required, className, containerClassName, id, ...props },
    ref,
  ) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const [visible, setVisible] = useState(false);

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
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={cn(
              "w-full bg-transparent text-ink outline-none placeholder:text-muted/70",
              className,
            )}
            aria-invalid={Boolean(error)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            tabIndex={-1}
            className="shrink-0 text-muted transition hover:text-ink"
          >
            {visible ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.4 5.2A10.4 10.4 0 0 1 12 5c5 0 9 4 10.5 7-.6 1.2-1.5 2.5-2.6 3.6M6.6 6.6C4.5 8 2.9 9.9 1.5 12c1.5 3 5.5 7 10.5 7 1.3 0 2.5-.3 3.6-.7" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </FieldWrapper>
    );
  },
);
