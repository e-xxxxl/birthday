import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert, LoadingBlock } from "@/components/ui/Feedback";
import { Input, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { LocationPicker } from "@/components/shipping/LocationPicker";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import { formatDateTime, formatNaira } from "@/lib/utils";
import type { ShippingSettings } from "@/types/shipping";

type Res = { settings: ShippingSettings };

export function AdminShippingPage() {
  useDocumentTitle("Shipping settings");
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => http.get<Res>("/api/admin/shipping/settings"), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [hook, setHook] = useState<{ url: string; registered: boolean; configured?: boolean; alreadyRegistered?: boolean } | null>(null);
  const [check, setCheck] = useState<{ ok: boolean; status: number; message: string; baseUrl: string; keyMasked: string } | null>(null);

  const [tiers, setTiers] = useState<{ minKg: string; maxKg: string; percent: string }[]>([]);
  const [fees, setFees] = useState({ flat: "", surcharge: "", threshold: "" });
  const [rates, setRates] = useState<{ code: string; rate: string }[]>([]);
  const [quoteCurrency, setQuoteCurrency] = useState("USD");
  const [office, setOffice] = useState<ShippingSettings["office"] | null>(null);
  const [texts, setTexts] = useState({ refund: "", duties: "", disclaimer: "" });

  useEffect(() => {
    const s = data?.settings;
    if (!s) return;
    setTiers(s.markupTiers.map((t) => ({ minKg: String(t.minKg), maxKg: String(t.maxKg), percent: String(t.percent) })));
    setFees({ flat: String(s.flatFeeNgn), surcharge: String(s.surchargeNgn), threshold: String(s.walletAlertThresholdNgn) });
    setRates(Object.entries(s.exchangeRates).map(([code, rate]) => ({ code, rate: String(rate) })));
    setQuoteCurrency(s.internationalQuoteCurrency);
    setOffice(s.office);
    setTexts({ refund: s.refundPolicyText, duties: s.dutiesNotice, disclaimer: s.disclaimerParagraphs.join("\n\n") });
  }, [data]);

  if (loading && !data) return <LoadingBlock />;
  if (error || !data || !office) return <Alert tone="danger">{error ?? "Could not load settings."}</Alert>;
  const s = data.settings;

  async function save(key: string, body: Record<string, unknown>, ok = "Saved") {
    setBusy(key);
    try {
      await http.put("/api/admin/shipping/settings", body);
      toast.success(ok);
      reload();
    } catch (err) {
      toast.error("Could not save", err instanceof HttpError ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function testConnection() {
    setBusy("check");
    try {
      const res = await http.post<{ check: NonNullable<typeof check> }>("/api/admin/shipping/terminal-check");
      setCheck(res.check);
    } catch (err) {
      toast.error("Could not run the check", err instanceof HttpError ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function webhookStatus() {
    setBusy("hook");
    try {
      setHook(await http.get<NonNullable<typeof hook>>("/api/admin/shipping/webhook"));
    } catch (err) {
      toast.error("Could not check the webhook", err instanceof HttpError ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function registerWebhook() {
    setBusy("hook");
    try {
      const res = await http.post<NonNullable<typeof hook>>("/api/admin/shipping/webhook/register");
      setHook(res);
      toast.success(res.alreadyRegistered ? "Already registered with Terminal" : "Webhook registered with Terminal");
    } catch (err) {
      toast.error("Could not register the webhook", err instanceof HttpError ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function refreshWallet() {
    setBusy("wallet");
    try {
      await http.post("/api/admin/shipping/wallet/refresh");
      reload();
    } catch (err) {
      toast.error("Could not read the wallet", err instanceof HttpError ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  const setOff = (p: Partial<ShippingSettings["office"]>) => setOffice({ ...office, ...p });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">Shipping settings</h1>
        <p className="text-sm text-muted">Prices, fees, exchange rates and wording for interstate and international shipping.</p>
      </div>

      {!s.terminal.configured ? (
        <Alert tone="warning" title="Terminal Africa is not connected">
          Add TERMINAL_AFRICA_URL and TERMINAL_AFRICA_SECRET_KEY to the server environment to fetch live carrier rates.
        </Alert>
      ) : (
        <Alert tone="info">
          Connected to Terminal Africa in <strong>{s.terminal.sandbox ? "sandbox (test)" : "live"}</strong> mode.
        </Alert>
      )}

      <Card>
        <CardHeader title="Connection test" description="Makes one real call to Terminal Africa and shows exactly what it answers." />
        <CardBody className="space-y-3">
          <Button size="sm" variant="secondary" onClick={testConnection} loading={busy === "check"}>
            Test connection
          </Button>
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <Button size="sm" variant="secondary" onClick={webhookStatus} loading={busy === "hook"}>
              Check tracking webhook
            </Button>
            <Button size="sm" onClick={registerWebhook} loading={busy === "hook"}>
              Register with Terminal
            </Button>
            <span className="text-xs text-muted">Terminal only sends tracking updates to an address you have registered.</span>
          </div>
          {hook ? (
            <p className="text-sm">
              <span className="font-bold">{hook.registered ? "Registered" : "Not registered"}:</span> <span className="break-all">{hook.url}</span>
            </p>
          ) : null}
          {check ? (
            <div className={check.ok ? "border-l-4 border-[var(--color-success)] bg-[var(--color-success-soft)] p-3" : "border-l-4 border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3"}>
              <p className="font-mono text-sm font-medium">
                {check.ok ? "OK" : "FAILED"} {check.status ? `(HTTP ${check.status})` : ""}: {check.message}
              </p>
              <p className="mt-1 font-mono text-xs text-muted">
                {check.baseUrl} · key {check.keyMasked}
              </p>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Carrier wallet" description="Booking a shipment charges your Terminal wallet. Keep it funded." />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-3xl font-bold font-mono tabular-nums">{s.wallet.balanceNgn != null ? formatNaira(s.wallet.balanceNgn) : "Unknown"}</p>
            {s.wallet.low ? <Badge tone="danger">Low</Badge> : s.wallet.balanceNgn != null ? <Badge tone="success">OK</Badge> : null}
            <Button size="sm" variant="secondary" onClick={refreshWallet} loading={busy === "wallet"}>
              Check now
            </Button>
          </div>
          {s.wallet.checkedAt ? <p className="text-xs text-muted">Checked {formatDateTime(s.wallet.checkedAt)}</p> : null}
          {s.wallet.error ? <Alert tone="warning">{s.wallet.error}</Alert> : null}
          <div className="flex flex-wrap items-end gap-3">
            <Input label="Alert me when below (NGN)" type="number" min="0" value={fees.threshold} onChange={(e) => setFees({ ...fees, threshold: e.target.value })} containerClassName="w-60" />
            <Button size="sm" loading={busy === "threshold"} onClick={() => save("threshold", { walletAlertThresholdNgn: Number(fees.threshold) })}>
              Save level
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Markup by weight" description={`Weight is rounded up to the next whole kg. Parcels over ${s.maxAutoQuoteKg} kg are quoted by hand.`} />
        <CardBody className="space-y-3">
          {tiers.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3">
              <Input label={i === 0 ? "From (kg)" : undefined} aria-label="From kg" type="number" min="1" value={t.minKg} onChange={(e) => setTiers(tiers.map((x, n) => (n === i ? { ...x, minKg: e.target.value } : x)))} />
              <Input label={i === 0 ? "To (kg)" : undefined} aria-label="To kg" type="number" min="1" value={t.maxKg} onChange={(e) => setTiers(tiers.map((x, n) => (n === i ? { ...x, maxKg: e.target.value } : x)))} />
              <Input label={i === 0 ? "Markup %" : undefined} aria-label="Markup percent" type="number" min="0" max="100" step="0.1" value={t.percent} onChange={(e) => setTiers(tiers.map((x, n) => (n === i ? { ...x, percent: e.target.value } : x)))} />
              <button type="button" aria-label="Remove tier" onClick={() => setTiers(tiers.filter((_, n) => n !== i))} className="mb-1 grid size-9 place-items-center rounded-sm text-lg text-muted hover:text-[var(--color-danger)]">
                −
              </button>
            </div>
          ))}
          <button type="button" className="text-sm font-semibold text-ink-soft hover:text-ink" onClick={() => setTiers([...tiers, { minKg: "", maxKg: "", percent: "" }])}>
            + Add tier
          </button>
          <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <Input label="Handling fee (NGN)" type="number" min="0" value={fees.flat} onChange={(e) => setFees({ ...fees, flat: e.target.value })} />
            <Input label="Surcharge (NGN)" type="number" min="0" value={fees.surcharge} onChange={(e) => setFees({ ...fees, surcharge: e.target.value })} />
          </div>
          <p className="text-xs text-muted">Shipping total = carrier rate + carrier rate x markup % + handling fee + surcharge.</p>
          <Button
            loading={busy === "pricing"}
            onClick={() =>
              save("pricing", {
                markupTiers: tiers.map((t) => ({ minKg: Number(t.minKg), maxKg: Number(t.maxKg), percent: Number(t.percent) })),
                flatFeeNgn: Number(fees.flat),
                surchargeNgn: Number(fees.surcharge),
              })
            }
          >
            Save pricing
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Exchange rates"
          description={`Foreign carrier prices are converted to naira with these rates before the markup. ${s.exchangeRatesUpdatedAt ? `Last updated ${formatDateTime(s.exchangeRatesUpdatedAt)}.` : "Not set yet."}`}
        />
        <CardBody className="space-y-3">
          {rates.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_auto] items-end gap-3">
              <Input label={i === 0 ? "Currency" : undefined} aria-label="Currency code" maxLength={3} value={r.code} onChange={(e) => setRates(rates.map((x, n) => (n === i ? { ...x, code: e.target.value.toUpperCase() } : x)))} />
              <Input label={i === 0 ? "Naira per 1 unit" : undefined} aria-label="Naira per unit" type="number" min="0" step="0.01" value={r.rate} onChange={(e) => setRates(rates.map((x, n) => (n === i ? { ...x, rate: e.target.value } : x)))} />
              <button type="button" aria-label="Remove rate" onClick={() => setRates(rates.filter((_, n) => n !== i))} className="mb-1 grid size-9 place-items-center rounded-sm text-lg text-muted hover:text-[var(--color-danger)]">
                −
              </button>
            </div>
          ))}
          <button type="button" className="text-sm font-semibold text-ink-soft hover:text-ink" onClick={() => setRates([...rates, { code: "", rate: "" }])}>
            + Add currency
          </button>
          <Input label="Currency to ask the carrier for on international shipments" maxLength={3} value={quoteCurrency} onChange={(e) => setQuoteCurrency(e.target.value.toUpperCase())} containerClassName="max-w-xs" />
          <Button
            loading={busy === "fx"}
            onClick={() =>
              save("fx", {
                exchangeRates: Object.fromEntries(rates.filter((r) => r.code.length === 3 && Number(r.rate) > 0).map((r) => [r.code, Number(r.rate)])),
                internationalQuoteCurrency: quoteCurrency,
              })
            }
          >
            Save exchange rates
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Office" description="Where customers drop packages off, and where the carrier collects every shipment." />
        <CardBody className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Office name" value={office.name} onChange={(e) => setOff({ name: e.target.value })} />
            <Input label="Contact name" value={office.contactName} onChange={(e) => setOff({ contactName: e.target.value })} />
            <Input label="Phone" value={office.phone} onChange={(e) => setOff({ phone: e.target.value })} hint="The carrier needs it in international form, like +2348031234567 (0803... is converted)" />
            <Input label="Email" value={office.email} onChange={(e) => setOff({ email: e.target.value })} />
            <Input label="Address line 1" value={office.line1} onChange={(e) => setOff({ line1: e.target.value })} />
            <Input label="Address line 2" value={office.line2} onChange={(e) => setOff({ line2: e.target.value })} />
            <Input label="Postcode" value={office.zip} onChange={(e) => setOff({ zip: e.target.value })} />
            <Input label="Opening hours" value={office.openingHours} onChange={(e) => setOff({ openingHours: e.target.value })} />
            <Input label="Latitude" type="number" step="any" value={office.lat ?? ""} onChange={(e) => setOff({ lat: e.target.value === "" ? null : Number(e.target.value) })} hint="Needed for rider pickups" />
            <Input label="Longitude" type="number" step="any" value={office.lng ?? ""} onChange={(e) => setOff({ lng: e.target.value === "" ? null : Number(e.target.value) })} />
          </div>
          <LocationPicker
            value={{ country: "NG", state: office.state, city: office.city }}
            onChange={(p) => setOff({ state: p.state, city: p.city })}
            lockedCountry="NG"
          />
          <Button loading={busy === "office"} onClick={() => save("office", { office })}>
            Save office
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Wording" description="Shown to customers. Separate disclaimer paragraphs with a blank line." />
        <CardBody className="space-y-3">
          <Textarea label="Pickup fee refund policy (shown at payment)" value={texts.refund} onChange={(e) => setTexts({ ...texts, refund: e.target.value })} className="min-h-32" />
          <Textarea label="Duties and taxes notice (international)" value={texts.duties} onChange={(e) => setTexts({ ...texts, duties: e.target.value })} />
          <Textarea label="Important notice (footer, Express page, checkout, price list PDF)" value={texts.disclaimer} onChange={(e) => setTexts({ ...texts, disclaimer: e.target.value })} className="min-h-40" />
          <Button
            loading={busy === "texts"}
            onClick={() =>
              save("texts", {
                refundPolicyText: texts.refund,
                dutiesNotice: texts.duties,
                disclaimerParagraphs: texts.disclaimer.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
              })
            }
          >
            Save wording
          </Button>
          <p className="text-xs text-muted">A price list PDF keeps the notice it had when it was uploaded.</p>
        </CardBody>
      </Card>
    </div>
  );
}
