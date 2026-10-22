import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FieldWrapper } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

/**
 * A select you can type into. Follows the ARIA combobox pattern: arrow keys move, Enter picks,
 * Escape closes, and the list is filtered as you type. Shows a loading row while options load
 * and an error row with a retry button if they could not be fetched.
 */
export function SearchSelect({
  label,
  value,
  onChange,
  options,
  loading,
  error,
  onRetry,
  disabled,
  placeholder = "Type to search",
  required,
  fieldError,
  hint,
  emptyText = "No matches",
}: {
  label: string;
  value: string;
  onChange: (option: SelectOption | null) => void;
  options: SelectOption[];
  loading?: boolean;
  /** A problem fetching the options. Shown in the list with a retry button. */
  error?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  /** A validation message for the field. */
  fieldError?: string;
  hint?: string;
  emptyText?: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.value === value) ?? null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  // While closed the input shows the chosen label; while open it shows what is being typed.
  const shown = open ? query : (selected?.label ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // Names that start with the text come first, then names that contain it.
    const starts: SelectOption[] = [];
    const has: SelectOption[] = [];
    for (const o of options) {
      const l = o.label.toLowerCase();
      if (l.startsWith(q)) starts.push(o);
      else if (l.includes(q)) has.push(o);
    }
    return [...starts, ...has];
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => setActive(0), [query, open]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, id]);

  function openList() {
    if (disabled) return;
    setQuery("");
    setOpen(true);
    const i = options.findIndex((o) => o.value === value);
    if (i >= 0) setActive(i);
  }

  function pick(o: SelectOption) {
    onChange(o);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) openList();
      else setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) openList();
      else setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home" && open) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End" && open) {
      e.preventDefault();
      setActive(Math.max(filtered.length - 1, 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (filtered[active]) pick(filtered[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <FieldWrapper label={label} required={required} htmlFor={id} error={fieldError} hint={hint}>
      <div ref={boxRef} className="relative">
        <div className="field-shell" data-invalid={Boolean(fieldError)} aria-disabled={disabled}>
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && filtered[active] ? `${id}-opt-${active}` : undefined}
            aria-invalid={Boolean(fieldError)}
            autoComplete="off"
            disabled={disabled}
            placeholder={loading ? "Loading…" : placeholder}
            value={shown}
            onFocus={openList}
            onClick={() => !open && openList()}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!open) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            className="w-full bg-transparent outline-none placeholder:text-muted disabled:cursor-not-allowed"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={open ? "Close list" : "Open list"}
            disabled={disabled}
            onClick={() => (open ? setOpen(false) : (inputRef.current?.focus(), openList()))}
            className="shrink-0 font-mono text-xs text-muted"
          >
            {open ? "▲" : "▼"}
          </button>
        </div>

        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto border-2 border-ink bg-paper"
          >
            {loading ? (
              <li role="status" className="px-3 py-3 font-mono text-xs uppercase tracking-wide text-muted">
                Loading…
              </li>
            ) : error ? (
              <li className="flex items-center justify-between gap-3 px-3 py-3 text-sm text-[var(--color-danger)]">
                <span>{error}</span>
                {onRetry ? (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="shrink-0 border-2 border-ink px-2.5 py-1 font-display text-sm font-bold uppercase tracking-wide text-ink hover:bg-ink hover:text-paper"
                  >
                    Retry
                  </button>
                ) : null}
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-muted">{emptyText}</li>
            ) : (
              filtered.map((o, i) => (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(o)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "cursor-pointer border-b border-line px-3 py-2 text-sm last:border-b-0",
                    i === active && "bg-accent text-ink",
                    o.value === value && i !== active && "bg-surface font-semibold",
                  )}
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </FieldWrapper>
  );
}
