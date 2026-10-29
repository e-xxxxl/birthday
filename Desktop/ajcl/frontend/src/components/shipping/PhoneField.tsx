import { useEffect, useRef, useState } from "react";
import { FieldWrapper } from "@/components/ui/Field";
import { http } from "@/lib/http";
import { cn } from "@/lib/utils";

/**
 * A phone number that always carries its country code. The country code is picked from Terminal's own
 * country list (with the dial codes it publishes), so the number the customer enters can go straight to the
 * carrier, which refuses anything that is not in international form. The value handed back is "+2348031234567".
 */

type Dial = { code: string; name: string; dial: string };

let cache: Promise<Dial[]> | null = null;
function loadDials(): Promise<Dial[]> {
  if (!cache) {
    cache = http
      .get<{ countries: { code: string; name: string; phonecode?: string | null }[] }>("/api/locations/countries")
      .then((r) =>
        r.countries
          .map((c) => ({ code: c.code, name: c.name, dial: (c.phonecode ?? "").replace(/\D/g, "") }))
          .filter((c) => c.dial)
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
      .catch((err) => {
        cache = null; // try again next time
        throw err;
      });
  }
  return cache;
}

const digits = (s: string) => s.replace(/\D/g, "");

/** Country code to dial code ("US" to "1"), once the list has loaded; null until then. */
export function useDialCodes(): Record<string, string> | null {
  const [map, setMap] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    let live = true;
    loadDials()
      .then((list) => live && setMap(Object.fromEntries(list.map((d) => [d.code, d.dial]))))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  return map;
}

/** Whether "+<dial><number>" starts with the dial code of the address country. True when that cannot be told. */
export function phoneMatchesCountry(phone: string, country: string, dials: Record<string, string> | null): boolean {
  const dial = dials?.[country.toUpperCase()];
  const all = digits(phone);
  if (!dial || !all) return true;
  if (all.startsWith(dial)) return true;
  // North American numbers share the code 1 whatever the island or state.
  return dial.startsWith("1") && all.startsWith("1");
}

/** Split "+2348031234567" into its dial code and the rest, using the longest dial code that matches. */
function split(value: string, dials: Dial[], fallbackDial: string): { dial: string; national: string } {
  const v = value.trim();
  if (v.startsWith("+") || v.startsWith("00")) {
    const all = digits(v.startsWith("00") ? v.slice(2) : v);
    const match = dials.filter((d) => all.startsWith(d.dial)).sort((a, b) => b.dial.length - a.dial.length)[0];
    if (match) return { dial: match.dial, national: all.slice(match.dial.length).replace(/^0+/, "") };
    return { dial: fallbackDial, national: all };
  }
  return { dial: fallbackDial, national: digits(v).replace(/^0+/, "") };
}

export function PhoneField({
  label = "Phone",
  value,
  country,
  onChange,
  error,
  required,
}: {
  label?: string;
  value: string;
  /** ISO code of the address this number belongs to; its dial code is chosen first. */
  country: string;
  onChange: (phone: string) => void;
  error?: string;
  required?: boolean;
}) {
  const [dials, setDials] = useState<Dial[] | null>(null);
  const [failed, setFailed] = useState(false);
  // The chosen COUNTRY, not the dial code: the US and Canada (and others) share +1, and the list must keep what was picked.
  const [iso, setIso] = useState("");
  const [national, setNational] = useState("");
  const ready = useRef(false);
  const lastCountry = useRef(country);

  useEffect(() => {
    let live = true;
    loadDials()
      .then((d) => live && setDials(d))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const dialFor = (c: string) => dials?.find((d) => d.code === c.toUpperCase())?.dial ?? "";
  const dial = dialFor(iso);
  /** The country to show for a dial code: the address country when it uses that code, else the first that does. */
  const isoFor = (d: string) => (dialFor(country) === d ? country.toUpperCase() : dials?.find((x) => x.dial === d)?.code ?? "");

  // Once the list is here, read what the form already holds (for example the account phone) and tidy it into place.
  useEffect(() => {
    if (!dials || ready.current) return;
    ready.current = true;
    const s = split(value, dials, dialFor(country) || "234");
    setIso(isoFor(s.dial));
    setNational(s.national);
    if (s.national && `+${s.dial}${s.national}` !== value) onChange(`+${s.dial}${s.national}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dials]);

  // A different address country brings its own dial code along.
  useEffect(() => {
    if (!dials || !ready.current || lastCountry.current === country) return;
    lastCountry.current = country;
    const d = dialFor(country);
    if (d) {
      setIso(country.toUpperCase());
      if (d !== dial) onChange(national ? `+${d}${national}` : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, dials]);

  const compose = (d: string, n: string) => {
    const clean = digits(n).replace(/^0+/, "");
    setNational(clean);
    onChange(clean ? `+${d}${clean}` : "");
  };

  // The country list could not load: still ask for the full international number, never a local one.
  if (failed) {
    return (
      <FieldWrapper label={label} required={required} error={error} hint="Start with + and the country code, like +234 803 123 4567">
        <div className="field-shell" data-invalid={Boolean(error)}>
          <input type="tel" value={value} onChange={(e) => onChange(e.target.value)} placeholder="+234 803 123 4567" className="w-full bg-transparent outline-none" />
        </div>
      </FieldWrapper>
    );
  }

  return (
    <FieldWrapper label={label} required={required} error={error} hint="Choose the country code, then type the number without the first 0">
      <div className="flex gap-2">
        <select
          aria-label={`${label} country code`}
          value={iso}
          disabled={!dials}
          onChange={(e) => {
            setIso(e.target.value);
            compose(dialFor(e.target.value), national);
          }}
          className={cn("h-12 w-[7.5rem] shrink-0 rounded-xl border-[1.5px] border-line-strong bg-paper px-2 text-sm", error && "border-[var(--color-danger)]")}
        >
          {!dials ? <option value="">Loading</option> : null}
          {dials?.map((d) => (
            <option key={d.code} value={d.code} title={d.name}>
              {d.code} +{d.dial}
            </option>
          ))}
        </select>
        <div className="field-shell grow" data-invalid={Boolean(error)}>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={national}
            disabled={!dials}
            onChange={(e) => compose(dial, e.target.value)}
            placeholder="803 123 4567"
            className="w-full bg-transparent outline-none"
          />
        </div>
      </div>
    </FieldWrapper>
  );
}
