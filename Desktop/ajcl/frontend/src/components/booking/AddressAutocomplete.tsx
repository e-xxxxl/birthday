
import { isPlusCode } from "@/lib/maps/address";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MAPS_CONFIG } from "@/config/maps";
import {
  searchAddresses,
  resolveAddress,
  newSearchSession,
  type Prediction,
  type SearchSession,
} from "@/lib/maps/client";
import type { LocationDTO } from "@/types";

type Props = {
  label: string;
  value: LocationDTO | null;
  onChange: (loc: LocationDTO | null) => void;
  browserKey?: string | null;
  placeholder?: string;
  required?: boolean;
  error?: string;
  tone?: "pickup" | "stop" | "destination";
};

export function AddressAutocomplete({
  label,
  value,
  onChange,
  browserKey = null,
  placeholder = "Search for an address",
  required,
  error,
  tone = "stop",
}: Props) {
  const listId = useId();
  const [text, setText] = useState(value?.formattedAddress ?? "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [configured, setConfigured] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const sessionRef = useRef<SearchSession | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const resolvedRef = useRef<string>(value?.formattedAddress ?? "");
  const reqId = useRef(0);

  async function session(): Promise<SearchSession> {
    if (!sessionRef.current) sessionRef.current = await newSearchSession(browserKey);
    return sessionRef.current;
  }

  useEffect(() => {
    if (value?.formattedAddress && value.formattedAddress !== resolvedRef.current) {
      setText(value.formattedAddress);
      resolvedRef.current = value.formattedAddress;
    }
  }, [value?.formattedAddress]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function runSearch(next: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (next.trim().length < MAPS_CONFIG.autocompleteMinChars) {
      setPredictions([]);
      setLoading(false);
      setSearchError(null);
      return;
    }
    setLoading(true);
    const mine = ++reqId.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchAddresses(next, await session(), browserKey);
        if (mine !== reqId.current) return; // a newer keystroke won
        setPredictions(res.predictions);
        setConfigured(res.source !== "none");
        setSearchError(res.error ?? null);
        setOpen(true);
      } catch {
        if (mine !== reqId.current) return;
        setPredictions([]);
        setSearchError("Address search is unavailable right now.");
      } finally {
        if (mine === reqId.current) setLoading(false);
      }
    }, MAPS_CONFIG.autocompleteDebounceMs);
  }

  function handleTextChange(next: string) {
    setText(next);
    setActiveIndex(-1);
    if (value) onChange(null); // typing invalidates a resolved place
    runSearch(next);
  }

  async function choose(p: Prediction) {
    setOpen(false);
    setText(p.fullText || p.primaryText);
    setLoading(true);
    try {
      const loc = await resolveAddress(p.placeId, await session(), browserKey);
      if (loc) {
        // Google can return just a plus code ("Q3F2+HX Lagos"). The prediction's own
        // description is a readable address, so use that instead.
        let resolved = loc;
        if (isPlusCode(resolved.formattedAddress) && p.fullText && !isPlusCode(p.fullText)) {
          resolved = { ...resolved, formattedAddress: p.fullText };
        }
        // Keep the place's name (e.g. "Shoprite Ikeja") as a landmark for the rider.
        if (
          !resolved.name &&
          p.primaryText &&
          !resolved.formattedAddress.toLowerCase().startsWith(p.primaryText.toLowerCase()) &&
          !isPlusCode(p.primaryText)
        ) {
          resolved = { ...resolved, name: p.primaryText };
        }
        resolvedRef.current = resolved.formattedAddress;
        onChange(resolved);
      } else {
        onChange({ formattedAddress: p.fullText || p.primaryText, manual: true });
      }
    } catch {
      onChange({ formattedAddress: p.fullText || p.primaryText, manual: true });
    } finally {
      setLoading(false);
      sessionRef.current = null; // end the billing session
    }
  }

  function useTypedAddress() {
    if (text.trim().length < 4) return;
    resolvedRef.current = text.trim();
    onChange({ formattedAddress: text.trim(), manual: true });
    setOpen(false);
  }

  const dotColor =
    tone === "pickup"
      ? "bg-[var(--color-success)]"
      : tone === "destination"
        ? "bg-[var(--color-danger)]"
        : "bg-accent";

  return (
    <div ref={boxRef} className="relative">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
        {required ? <span className="ml-0.5 text-[var(--color-danger)]">*</span> : null}
      </label>

      <div className="field-shell mt-1.5" data-invalid={Boolean(error)}>
        <span className={cn("size-2.5 shrink-0 rounded-full", dotColor)} />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          className="w-full bg-transparent outline-none placeholder:text-muted/70"
          placeholder={placeholder}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onFocus={() => predictions.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && open && activeIndex >= 0) {
              e.preventDefault();
              void choose(predictions[activeIndex]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {loading ? (
          <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-ink border-r-transparent" />
        ) : value && !value.manual ? (
          <span className="shrink-0 text-xs font-bold text-[var(--color-success)]">✓</span>
        ) : value?.manual ? (
          <span className="shrink-0 text-[10px] font-bold uppercase text-muted">manual</span>
        ) : null}
      </div>

      {error ? (
        <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">{error}</p>
      ) : null}

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-line bg-paper shadow-pop"
        >
          {predictions.length > 0 ? (
            predictions.map((p, i) => (
              <button
                key={p.placeId}
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => void choose(p)}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm",
                  i === activeIndex ? "bg-surface" : "hover:bg-surface",
                )}
              >
                <span className="font-semibold text-ink">{p.primaryText || p.fullText}</span>
                {p.secondaryText ? (
                  <span className="text-xs text-muted">{p.secondaryText}</span>
                ) : null}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm">
              {loading ? (
                <span className="text-muted">Searching…</span>
              ) : searchError ? (
                <span className="text-[var(--color-warning)]">{searchError}</span>
              ) : !configured ? (
                <span className="text-muted">Address search isn&apos;t configured.</span>
              ) : (
                <span className="text-muted">No matches found.</span>
              )}
            </div>
          )}

          {text.trim().length >= 4 ? (
            <button
              type="button"
              onClick={useTypedAddress}
              className="w-full border-t border-line bg-surface/60 px-4 py-2.5 text-left text-xs font-semibold text-ink-soft hover:bg-surface"
            >
              Use “{text.trim()}” as typed
            </button>
          ) : null}
        </div>
      ) : null}

      {(!configured || searchError) && !open ? (
        <p className="mt-1 text-xs text-muted">
          Type the full address — automatic suggestions are unavailable. You can still enter it
          manually.
        </p>
      ) : null}
    </div>
  );
}
