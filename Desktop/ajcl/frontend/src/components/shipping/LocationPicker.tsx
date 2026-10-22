import { useCallback, useEffect, useState } from "react";
import { SearchSelect, type SelectOption } from "@/components/ui/SearchSelect";
import { FieldWrapper } from "@/components/ui/Field";
import { Input } from "@/components/ui/Field";
import { http, HttpError } from "@/lib/http";
import { regionName } from "@/lib/utils";

/**
 * Country, state and city, loaded from our API (which reads Terminal Africa's lists).
 * The browser keeps what it has already fetched, and nothing here is a built-in list.
 */

type Remote<T> = { data?: T; loading: boolean; error?: string; retry: () => void };

const memory = new Map<string, unknown>();

function useRemote<T>(key: string | null, load: () => Promise<T>): Remote<T> {
  const [state, setState] = useState<{ key: string | null; data?: T; error?: string; loading: boolean }>(() => ({
    key,
    data: key ? (memory.get(key) as T | undefined) : undefined,
    loading: Boolean(key) && !memory.has(key ?? ""),
  }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!key) {
      setState({ key, loading: false });
      return;
    }
    const known = memory.get(key) as T | undefined;
    if (known && attempt === 0) {
      setState({ key, data: known, loading: false });
      return;
    }
    let cancelled = false;
    setState({ key, loading: true });
    load()
      .then((data) => {
        memory.set(key, data);
        if (!cancelled) setState({ key, data, loading: false });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            key,
            loading: false,
            error: err instanceof HttpError ? err.message : "Could not load this list. Check your connection and try again.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  // A key change shows loading straight away instead of one frame of the old list.
  const stale = state.key !== key;
  return { data: stale ? undefined : state.data, loading: stale ? Boolean(key) : state.loading, error: stale ? undefined : state.error, retry };
}

export type PlaceValue = { country: string; state: string; city: string };

export function LocationPicker({
  value,
  onChange,
  lockedCountry,
  excludeCountries = [],
  stacked = false,
  errors = {},
  required = true,
}: {
  value: PlaceValue;
  onChange: (next: PlaceValue) => void;
  /** Fix the country (for example "NG" for interstate shipments). */
  lockedCountry?: string;
  /** Countries to leave out of the list. */
  excludeCountries?: string[];
  /** One field per row, for narrow columns. */
  stacked?: boolean;
  errors?: { country?: string; state?: string; city?: string };
  required?: boolean;
}) {
  const country = lockedCountry ?? value.country;

  const countries = useRemote(lockedCountry ? null : "countries", () =>
    http.get<{ countries: { code: string; name: string }[] }>("/api/locations/countries").then((r) => r.countries),
  );
  const states = useRemote(country ? `states:${country}` : null, () =>
    http.get<{ states: { code: string; name: string }[] }>(`/api/locations/states?country=${encodeURIComponent(country)}`).then((r) => r.states),
  );
  const stateCode = states.data?.find((s) => s.name === value.state)?.code;
  const cities = useRemote(country && stateCode ? `cities:${country}:${stateCode}` : null, () =>
    http
      .get<{ cities: { name: string }[] }>(`/api/locations/cities?country=${encodeURIComponent(country)}&state=${encodeURIComponent(stateCode ?? "")}`)
      .then((r) => r.cities),
  );

  // A locked country is set once, so the parent's value always carries it.
  useEffect(() => {
    if (lockedCountry && value.country !== lockedCountry) onChange({ country: lockedCountry, state: "", city: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedCountry]);

  const countryOptions: SelectOption[] = (countries.data ?? [])
    .filter((c) => !excludeCountries.includes(c.code))
    .map((c) => ({ value: c.code, label: c.name }));
  const stateOptions: SelectOption[] = (states.data ?? []).map((s) => ({ value: s.name, label: s.name }));
  const cityOptions: SelectOption[] = (cities.data ?? []).map((c) => ({ value: c.name, label: c.name }));
  // Terminal lists no cities for some states. Then the city is typed, and the server checks it.
  const cityListEmpty = Boolean(stateCode) && !cities.loading && !cities.error && (cities.data?.length ?? 0) === 0;

  return (
    <div className={stacked ? "grid gap-4" : "grid gap-4 sm:grid-cols-3"}>
      {lockedCountry ? (
        <FieldWrapper label="Country" required={required}>
          <div className="field-shell bg-surface" aria-readonly>
            <span className="font-semibold">{regionName(lockedCountry)}</span>
          </div>
        </FieldWrapper>
      ) : (
        <SearchSelect
          label="Country"
          required={required}
          value={value.country}
          options={countryOptions}
          loading={countries.loading}
          error={countries.error}
          onRetry={countries.retry}
          fieldError={errors.country}
          placeholder="Search countries"
          onChange={(o) => onChange({ country: o?.value ?? "", state: "", city: "" })}
        />
      )}

      <SearchSelect
        label="State / region"
        required={required}
        value={value.state}
        options={stateOptions}
        loading={states.loading}
        error={states.error}
        onRetry={states.retry}
        disabled={!country}
        fieldError={errors.state}
        placeholder={country ? "Search states" : "Choose a country first"}
        onChange={(o) => onChange({ country, state: o?.value ?? "", city: "" })}
      />

      {cityListEmpty ? (
        <Input
          label="City"
          required={required}
          value={value.city}
          onChange={(e) => onChange({ country, state: value.state, city: e.target.value })}
          error={errors.city}
          hint="No cities are listed for this state. Type the city."
        />
      ) : (
        <SearchSelect
          label="City"
          required={required}
          value={value.city}
          options={cityOptions}
          loading={cities.loading}
          error={cities.error}
          onRetry={cities.retry}
          disabled={!value.state}
          fieldError={errors.city}
          placeholder={value.state ? "Search cities" : "Choose a state first"}
          onChange={(o) => onChange({ country, state: value.state, city: o?.value ?? "" })}
        />
      )}
    </div>
  );
}
