import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { FieldWrapper } from "./Field";

/**
 * Numeric field with −/+ steppers that you can also type into. Works well on
 * mobile where the plain number-input spinners are hidden/tiny.
 */
export function QuantityField({
  label,
  value,
  onChange,
  min = 1,
  max = 999,
  hint,
  error,
  required,
  containerClassName,
}: {
  label?: ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  containerClassName?: string;
}) {
  const id = useId();
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n) || min));

  // Local state so rapid −/+ taps accumulate correctly (functional updates).
  const [n, setN] = useState(clamp(value));
  useEffect(() => {
    setN(clamp(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (n !== value) onChange(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const btn =
    "grid size-8 shrink-0 place-items-center rounded-lg border border-line-strong text-xl leading-none text-ink-soft transition hover:border-ink hover:text-ink disabled:opacity-40";

  return (
    <FieldWrapper
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={id}
      className={containerClassName}
    >
      <div className="field-shell !py-1.5" data-invalid={Boolean(error)}>
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setN((p) => clamp(p - 1))}
          disabled={n <= min}
          className={btn}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={n}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setN(clamp(Number(e.target.value)))}
          onBlur={() => setN((p) => clamp(p))}
          aria-invalid={Boolean(error)}
          className="w-full min-w-0 bg-transparent text-center text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setN((p) => clamp(p + 1))}
          disabled={n >= max}
          className={btn}
        >
          +
        </button>
      </div>
    </FieldWrapper>
  );
}
