import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Input, Select } from "@/components/ui/Field";
import { DisclaimerNotice } from "@/components/shipping/ShipmentBits";
import { PageBanner } from "@/components/marketing/PageBanner";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import { formatDateTime, formatNaira } from "@/lib/utils";
import { LocationPicker } from "@/components/shipping/LocationPicker";
import type { RateEstimate, ShippingConfig } from "@/types/shipping";

export function QuotePage() {
  useDocumentTitle("International shipping quote");
  const { data: config } = useAsync(() => http.get<ShippingConfig>("/api/shipments/config"), []);
  const [form, setForm] = useState({ country: "", state: "", city: "", weight: "", length: "", width: "", height: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RateEstimate | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.country) next.country = "Choose a country";
    if (form.city.trim().length < 2) next.city = "Enter the city";
    if (form.state.trim().length < 2) next.state = "Enter the state or region";
    if (!(Number(form.weight) > 0)) next.weight = "Enter the weight in kg";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const hasDims = form.length && form.width && form.height;
      setResult(
        await http.post<RateEstimate>("/api/shipments/estimate", {
          shipmentType: "international",
          country: form.country,
          state: form.state.trim(),
          city: form.city.trim(),
          weightKg: Number(form.weight),
          dimensions: hasDims ? { lengthCm: Number(form.length), widthCm: Number(form.width), heightCm: Number(form.height) } : undefined,
        }),
      );
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "We could not get a quote right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageBanner image="port" crumb="International" title="Get a shipping quote" intro="Tell us where it is going and roughly how heavy it is. Prices come from live carrier rates." />
    <div className="container-page py-12 md:py-16">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>

        <Card>
          <CardBody>
            <form onSubmit={submit} className="space-y-4" noValidate>
              <LocationPicker
                value={{ country: form.country, state: form.state, city: form.city }}
                onChange={(p) => setForm({ ...form, country: p.country, state: p.state, city: p.city })}
                excludeCountries={["NG"]}
                stacked
                errors={{ country: errors.country, state: errors.state, city: errors.city }}
              />
              <Input label="Weight (kg)" required type="number" min="0.1" step="0.1" value={form.weight} onChange={set("weight")} error={errors.weight} hint="We weigh it at our office, and bill by the next whole kilogram." />
              <div className="grid grid-cols-3 gap-3">
                <Input label="Length (cm)" type="number" min="0" value={form.length} onChange={set("length")} />
                <Input label="Width (cm)" type="number" min="0" value={form.width} onChange={set("width")} />
                <Input label="Height (cm)" type="number" min="0" value={form.height} onChange={set("height")} />
              </div>
              <Button type="submit" size="lg" loading={loading} fullWidth>
                Get quote
              </Button>
            </form>
          </CardBody>
        </Card>

        {error ? <Alert tone="danger" className="mt-5">{error}</Alert> : null}
        </div>

        {result ? (
          <div className="space-y-4">
            {result.manualRequired ? (
              <Alert tone="info" title="Heavy shipment">
                Parcels over {config?.maxAutoQuoteKg ?? 70} kg are priced individually. Contact us and we will quote you directly.
              </Alert>
            ) : result.options.length === 0 ? (
              <Alert tone="warning">No carrier options were found for that route. Contact us and we will help.</Alert>
            ) : (
              <>
                <h2 className="text-2xl font-bold">Your options, billed as <span className="figure">{result.billedWeightKg} kg</span></h2>
                {result.options.map((o) => (
                  <div key={o.rateId} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-4 shadow-card">
                    <div className="flex min-w-0 items-center gap-3">
                      {o.carrierLogo ? <img src={o.carrierLogo} alt="" className="size-9 rounded-sm object-contain" loading="lazy" /> : null}
                      <div className="min-w-0">
                        <p className="truncate font-bold">{o.carrierName}</p>
                        {o.deliveryTime ? <p className="text-xs text-muted">{o.deliveryTime}</p> : null}
                      </div>
                    </div>
                    <p className="text-lg font-bold font-mono tabular-nums">{formatNaira(o.total)}</p>
                  </div>
                ))}
                <p className="text-xs text-muted">
                  An estimate based on your details. The final price is confirmed after we weigh your package.
                  {result.fxUpdatedAt ? ` Exchange rate last updated ${formatDateTime(result.fxUpdatedAt)}.` : ""}
                </p>
                <Button href="/send/international" size="lg" fullWidth>
                  Ship with us
                </Button>
              </>
            )}
            {config ? <Alert tone="warning">{config.dutiesNotice}</Alert> : null}
          </div>
        ) : null}

        <DisclaimerNotice paragraphs={config?.disclaimerParagraphs} className="lg:col-span-2" />
      </div>
    </div>
    </>
  );
}
