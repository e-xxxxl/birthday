import { useState } from "react";
import { Alert } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { LocationPicker } from "@/components/shipping/LocationPicker";
import { QuoteOptionCard } from "@/components/shipping/ShipmentBits";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import { formatDateTime, regionName } from "@/lib/utils";
import type { QuoteOption } from "@/types/shipping";

type Place = { country: string; state: string; city: string };
type Result = {
  domestic: boolean;
  from: Place;
  to: Place;
  manualRequired: boolean;
  billedWeightKg: number;
  fxUpdatedAt: string | null;
  options: QuoteOption[];
};

const blank = (country = ""): Place => ({ country, state: "", city: "" });

/**
 * For the shipments desk only: what would a carrier charge for this route? Any country can be the destination, Nigeria
 * included, and the two ends can even be in the same country, so it also answers "what does an interstate shipment cost".
 * Nothing is saved and nothing is sent to a customer.
 */
export function AdminQuotePage() {
  useDocumentTitle("Quote");
  const [from, setFrom] = useState<Place>(blank("NG"));
  const [to, setTo] = useState<Place>(blank("NG"));
  const [zips, setZips] = useState({ from: "", to: "" });
  const [pack, setPack] = useState({ weight: "", length: "", width: "", height: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!from.country) next.fromCountry = "Choose a country";
    if (from.state.trim().length < 2) next.fromState = "Enter the state or region";
    if (from.city.trim().length < 2) next.fromCity = "Enter the city";
    if (!to.country) next.toCountry = "Choose a country";
    if (to.state.trim().length < 2) next.toState = "Enter the state or region";
    if (to.city.trim().length < 2) next.toCity = "Enter the city";
    if (!(Number(pack.weight) > 0)) next.weight = "Enter the weight in kg";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const hasDims = pack.length && pack.width && pack.height;
      setResult(
        await http.post<Result>("/api/office/shipments/price-check", {
          from: { ...from, state: from.state.trim(), city: from.city.trim(), zip: zips.from.trim() || undefined },
          to: { ...to, state: to.state.trim(), city: to.city.trim(), zip: zips.to.trim() || undefined },
          weightKg: Number(pack.weight),
          dimensions: hasDims ? { lengthCm: Number(pack.length), widthCm: Number(pack.width), heightCm: Number(pack.height) } : undefined,
        }),
      );
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not get a quote right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const setPackField = (k: keyof typeof pack) => (e: React.ChangeEvent<HTMLInputElement>) => setPack({ ...pack, [k]: e.target.value });
  const swap = () => {
    setFrom(to);
    setTo(from);
    setZips({ from: zips.to, to: zips.from });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">Quote</h1>
        <p className="text-sm text-muted">
          What would a carrier charge for this route? Nigeria can be the destination, and both ends can be in the same country, so use it for interstate or any other shipment. Nothing is saved and nothing is sent to a customer.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardBody>
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="rule-label">From</h2>
                  <button type="button" onClick={swap} className="text-xs font-semibold text-muted hover:text-ink">
                    Swap from and to
                  </button>
                </div>
                <LocationPicker
                  value={from}
                  onChange={setFrom}
                  stacked
                  errors={{ country: errors.fromCountry, state: errors.fromState, city: errors.fromCity }}
                />
                <Input label="Postcode (optional)" value={zips.from} onChange={(e) => setZips({ ...zips, from: e.target.value })} containerClassName="max-w-xs" />
              </div>

              <div className="space-y-4 border-t border-line pt-5">
                <h2 className="rule-label">To</h2>
                <LocationPicker
                  value={to}
                  onChange={setTo}
                  stacked
                  errors={{ country: errors.toCountry, state: errors.toState, city: errors.toCity }}
                />
                <Input label="Postcode (optional)" value={zips.to} onChange={(e) => setZips({ ...zips, to: e.target.value })} hint="Some countries need it to price the delivery" containerClassName="max-w-xs" />
              </div>

              <div className="space-y-4 border-t border-line pt-5">
                <Input label="Weight (kg)" required type="number" min="0.1" step="0.1" value={pack.weight} onChange={setPackField("weight")} error={errors.weight} hint="Billed by the next whole kilogram." />
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Length (cm)" type="number" min="0" value={pack.length} onChange={setPackField("length")} />
                  <Input label="Width (cm)" type="number" min="0" value={pack.width} onChange={setPackField("width")} />
                  <Input label="Height (cm)" type="number" min="0" value={pack.height} onChange={setPackField("height")} />
                </div>
              </div>

              <Button type="submit" size="lg" loading={loading} fullWidth>
                Get quote
              </Button>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}

          {result ? (
            <>
              <div>
                <h2 className="text-2xl font-bold">
                  {result.from.city}, {regionName(result.from.country)} to {result.to.city}, {regionName(result.to.country)}
                </h2>
                <p className="text-sm text-muted">
                  Billed as <strong>{result.billedWeightKg} kg</strong>
                  {result.domestic ? " · inside one country, priced in naira" : ""}
                </p>
              </div>

              {result.manualRequired ? (
                <Alert tone="info" title="Priced by hand">
                  This weight is over the limit for automatic carrier rates. Price it individually.
                </Alert>
              ) : result.options.length === 0 ? (
                <Alert tone="warning">No carrier options were found for that route.</Alert>
              ) : (
                <div className="space-y-3">
                  {result.options.map((o) => (
                    <QuoteOptionCard key={o.rateId} option={o} breakdown />
                  ))}
                  <p className="text-xs text-muted">
                    These are the totals a customer would pay: the carrier rate plus our markup and fees. They are an estimate; the final price is set when the parcel is weighed.
                    {result.domestic ? " Interstate prices are set by hand, so use these as a guide when you set one." : ""}
                    {result.fxUpdatedAt ? ` Exchange rate last updated ${formatDateTime(result.fxUpdatedAt)}.` : ""}
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
