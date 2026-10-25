import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AddressAutocomplete } from "@/components/booking/AddressAutocomplete";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert, LoadingBlock, Skeleton } from "@/components/ui/Feedback";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { DisclaimerNotice } from "@/components/shipping/ShipmentBits";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import { cn, formatNaira, regionName } from "@/lib/utils";
import { vehicleImage } from "@/lib/vehicle-media";
import { LocationPicker } from "@/components/shipping/LocationPicker";
import type { LocationDTO, QuoteDTO } from "@/types";
import type { RateEstimate, Shipment, ShippingConfig } from "@/types/shipping";
import { toInternationalPhone, phoneProblem } from "@/lib/phone";
import { PhoneField } from "@/components/shipping/PhoneField";

export type PartyForm = {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  zip: string;
};
export type ItemForm = { description: string; quantity: string; value: string; hsCode: string };
type Draft = {
  sender: PartyForm;
  receiver: PartyForm;
  description: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  declaredValue: string;
  items: ItemForm[];
  method: "pickup" | "dropoff" | null;
  pickupLoc: LocationDTO | null;
  vehicleSlug: string | null;
  date: string;
  time: string;
  notes: string;
  agreed: boolean;
  /** International: the carrier picked on the Rates step, and the price shown for it. */
  carrier: string | null;
  carrierTotal: number | null;
};

export const blankParty = (country: string): PartyForm => ({
  name: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  country,
  zip: "",
});
export const blankItem = (): ItemForm => ({ description: "", quantity: "1", value: "", hsCode: "" });

type StepKey = "Package" | "Contents" | "Handover" | "Rates" | "Review";
const STEPS_INTERSTATE: StepKey[] = ["Package", "Contents", "Handover", "Review"];
/** International: once the handover is chosen, the next thing is to see carrier rates and pick one. */
const STEPS_INTERNATIONAL: StepKey[] = ["Package", "Contents", "Handover", "Rates", "Review"];

export function ShipmentWizardPage() {
  const { type } = useParams();
  if (type !== "interstate" && type !== "international") return <Navigate to="/send" replace />;
  return <Wizard type={type} />;
}

function Wizard({ type }: { type: "interstate" | "international" }) {
  const international = type === "international";
  useDocumentTitle(international ? "International shipment" : "Interstate shipment");
  const navigate = useNavigate();
  const { user } = useAuth();
  const storageKey = `ajc:shipment-draft:${type}:v1`;

  const { data: config, loading: configLoading } = useAsync(
    () => http.get<ShippingConfig>("/api/shipments/config"),
    [],
  );

  const [draft, setDraft] = useState<Draft>(() => {
    const base: Draft = {
      sender: { ...blankParty("NG"), name: user?.fullName ?? "", phone: user?.phone ?? "", email: user?.email ?? "" },
      receiver: blankParty(international ? "" : "NG"),
      description: "",
      weight: "",
      length: "",
      width: "",
      height: "",
      declaredValue: "",
      items: [blankItem()],
      method: null,
      pickupLoc: null,
      vehicleSlug: null,
      date: "",
      time: "",
      notes: "",
      agreed: false,
      carrier: null,
      carrierTotal: null,
    };
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) return { ...base, ...(JSON.parse(raw) as Partial<Draft>), agreed: false };
    } catch {
      /* ignore */
    }
    return base;
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft, storageKey]);

  const [step, setStep] = useState<StepKey>("Package");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const patchParty = (who: "sender" | "receiver", p: Partial<PartyForm>) =>
    setDraft((d) => ({ ...d, [who]: { ...d[who], ...p } }));

  const go = (s: StepKey) => {
    setStep(s);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const officeLoc = useMemo<LocationDTO | null>(() => {
    if (!config?.office.line1) return null;
    const o = config.office;
    return {
      formattedAddress: [o.line1, o.line2, o.city, o.state].filter(Boolean).join(", "),
      lat: o.lat ?? undefined,
      lng: o.lng ?? undefined,
      manual: o.lat == null || o.lng == null,
    };
  }, [config]);

  /* ── validation ───────────────────────────────────────────────────── */
  function validatePackage(): boolean {
    const e: Record<string, string> = {};
    const req = (key: string, v: string, msg = "Required") => {
      if (!v.trim()) e[key] = msg;
    };
    req("s-name", draft.sender.name);
    if (!toInternationalPhone(draft.sender.phone, draft.sender.country, { strict: true })) e["s-phone"] = phoneProblem(draft.sender.country);
    req("s-line1", draft.sender.line1, "Enter the street address");
    req("s-city", draft.sender.city);
    req("s-state", draft.sender.state);
    req("r-name", draft.receiver.name);
    if (!toInternationalPhone(draft.receiver.phone, draft.receiver.country, { strict: true })) e["r-phone"] = phoneProblem(draft.receiver.country);
    req("r-line1", draft.receiver.line1, "Enter the street address");
    req("r-city", draft.receiver.city);
    req("r-state", draft.receiver.state);
    if (international && !draft.receiver.country) e["r-country"] = "Choose a country";
    if (international && !draft.receiver.zip.trim()) e["r-zip"] = "Enter the postcode";
    if (draft.receiver.email && !/^\S+@\S+\.\S+$/.test(draft.receiver.email)) e["r-email"] = "Enter a valid email";
    if (draft.description.trim().length < 3) e.description = "Describe the package";
    const w = Number(draft.weight);
    if (!(w >= 0.01)) e.weight = "Enter the estimated weight in kg";
    else if (w > 1000) e.weight = "That is too heavy for online booking. Contact us.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateItems(): boolean {
    const e: Record<string, string> = {};
    const filled = draft.items.filter((i) => i.description.trim() || i.value);
    if (international && filled.length === 0) e.items = "List what is in the package (needed for customs)";
    draft.items.forEach((i, n) => {
      const touched = i.description.trim() || i.value || i.hsCode;
      if (!touched) return;
      if (i.description.trim().length < 2) e[`i-${n}-d`] = "Describe the item";
      if (!(Number(i.quantity) >= 1)) e[`i-${n}-q`] = "At least 1";
      if (i.value === "" || Number(i.value) < 0) e[`i-${n}-v`] = "Enter a value";
      if (i.hsCode && !/^[0-9.]{4,15}$/.test(i.hsCode)) e[`i-${n}-h`] = "4 to 10 digits";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateHandover(): boolean {
    const e: Record<string, string> = {};
    if (!draft.method) e.method = "Choose how we get your package";
    if (draft.method === "pickup") {
      if (!draft.pickupLoc?.formattedAddress) e.pickup = "Enter the pickup address";
      else if ((draft.pickupLoc.details ?? "").trim().length < 3) e.pickupDetails = "Add the house number or a landmark";
      if (!draft.vehicleSlug) e.vehicle = "Choose a vehicle";
      if (!draft.date) e.date = "Choose a date";
      if (!draft.time) e.time = "Choose a time";
      if (draft.date && draft.time && new Date(`${draft.date}T${draft.time}`).getTime() < Date.now()) {
        e.time = "Pick a time in the future";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── submit ───────────────────────────────────────────────────────── */
  async function submit() {
    if (!draft.agreed) {
      setErrors({ agreed: "Please confirm to continue" });
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const party = (p: PartyForm) => ({
      name: p.name.trim(),
      phone: toInternationalPhone(p.phone, p.country, { strict: true }) ?? p.phone.trim(),
      email: p.email.trim() || undefined,
      line1: p.line1.trim(),
      line2: p.line2.trim() || undefined,
      city: p.city.trim(),
      state: p.state.trim(),
      country: p.country,
      zip: p.zip.trim() || undefined,
    });
    const dims =
      draft.length && draft.width && draft.height
        ? { lengthCm: Number(draft.length), widthCm: Number(draft.width), heightCm: Number(draft.height) }
        : undefined;
    const items = draft.items
      .filter((i) => i.description.trim())
      .map((i) => ({
        description: i.description.trim(),
        quantity: Number(i.quantity) || 1,
        value: Number(i.value) || 0,
        hsCode: i.hsCode.trim() || undefined,
      }));

    try {
      const res = await http.post<{ shipment: Shipment }>("/api/shipments", {
        shipmentType: type,
        sender: party(draft.sender),
        receiver: party(draft.receiver),
        parcel: {
          description: draft.description.trim(),
          estimatedWeightKg: Number(draft.weight),
          dimensions: dims,
          declaredValue: Number(draft.declaredValue) || 0,
          items,
        },
        handover:
          draft.method === "pickup"
            ? {
                method: "pickup",
                pickup: {
                  location: draft.pickupLoc,
                  scheduledDate: draft.date,
                  scheduledTime: draft.time,
                  vehicleSlug: draft.vehicleSlug,
                  notes: draft.notes,
                },
              }
            : { method: "dropoff" },
      });
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
      const s = res.shipment;
      if (international && draft.carrier) {
        try {
          sessionStorage.setItem(`ajc:carrier:${s.reference}`, draft.carrier);
        } catch {
          /* ignore */
        }
      }
      if (s.handover.method === "pickup" && s.handover.pickupBookingReference) {
        // Straight on to paying the pickup fee. If that fails the shipment page offers it again.
        try {
          const pay = await http.post<{ authorizationUrl: string }>("/api/payments/initialize", {
            bookingReference: s.handover.pickupBookingReference,
          });
          window.location.href = pay.authorizationUrl;
          return;
        } catch {
          /* fall through to the shipment page */
        }
      }
      // International drop-off with a carrier already chosen: go straight to paying for shipping, if the price still matches.
      if (international && draft.carrier && s.prepay?.available) {
        const option = s.quote.options.find((o) => o.carrierName === draft.carrier);
        if (option && Math.abs(option.total - (draft.carrierTotal ?? option.total)) < 1) {
          try {
            const pay = await http.post<{ authorizationUrl: string }>(`/api/shipments/${s.reference}/pay`, { rateId: option.rateId });
            window.location.href = pay.authorizationUrl;
            return;
          } catch {
            /* fall through to the shipment page */
          }
        }
      }
      navigate(`/dashboard/shipments/${s.reference}`);
    } catch (err) {
      setSubmitError(err instanceof HttpError ? err.message : "Could not create the shipment. Please try again.");
      setSubmitting(false);
    }
  }

  const steps = international ? STEPS_INTERNATIONAL : STEPS_INTERSTATE;
  const stepIndex = steps.indexOf(step);

  return (
    <div className="container-page py-6 md:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold sm:text-4xl">{international ? "International shipment" : "Interstate shipment"}</h1>
          <button type="button" onClick={() => navigate("/send")} className="text-sm font-semibold text-muted hover:text-ink">
            Change type
          </button>
        </div>

        <ol className="mb-6 flex gap-2" aria-label="Progress">
          {steps.map((s, i) => (
            <li key={s} className="flex-1">
              <div className={cn("h-1.5 rounded-sm", i <= stepIndex ? "bg-ink" : "bg-line-strong")} />
              <p className={cn("mt-1.5 text-xs font-semibold", i === stepIndex ? "text-ink" : "text-muted")}>
                {i + 1}. {s}
              </p>
            </li>
          ))}
        </ol>

        {configLoading ? (
          <LoadingBlock />
        ) : step === "Package" ? (
          <PackageStep
            international={international}
            draft={draft}
            errors={errors}
            patch={patch}
            patchParty={patchParty}
            onNext={() => validatePackage() && go("Contents")}
          />
        ) : step === "Contents" ? (
          <ContentsStep
            international={international}
            draft={draft}
            errors={errors}
            patch={patch}
            onBack={() => go("Package")}
            onNext={() => validateItems() && go("Handover")}
          />
        ) : step === "Handover" ? (
          <HandoverStep
            draft={draft}
            errors={errors}
            patch={patch}
            config={config}
            officeLoc={officeLoc}
            onBack={() => go("Contents")}
            onNext={() => validateHandover() && go(international ? "Rates" : "Review")}
          />
        ) : step === "Rates" ? (
          <RatesStep draft={draft} errors={errors} patch={patch} onBack={() => go("Handover")} onNext={() => go("Review")} />
        ) : (
          <ReviewStep
            international={international}
            draft={draft}
            errors={errors}
            patch={patch}
            config={config}
            submitting={submitting}
            submitError={submitError}
            onBack={() => go(international ? "Rates" : "Handover")}
            onSubmit={submit}
          />
        )}
      </div>
    </div>
  );
}

/* ── Step 1: package ──────────────────────────────────────────────────── */

type StepCommon = { draft: Draft; errors: Record<string, string>; patch: (p: Partial<Draft>) => void };

export function PartyFields({
  prefix,
  title,
  party,
  errors,
  onChange,
  lockedCountry,
  excludeCountries,
  zipRequired,
  hideCountry,
}: {
  prefix: "s" | "r";
  title: string;
  party: PartyForm;
  errors: Record<string, string>;
  onChange: (p: Partial<PartyForm>) => void;
  /** Fix the country (the sender is always in Nigeria, and so is an interstate receiver). */
  lockedCountry?: string;
  excludeCountries?: string[];
  /** The carrier needs a postcode for this address. */
  zipRequired?: boolean;
  /** Do not show the (fixed) country. */
  hideCountry?: boolean;
}) {
  const e = (k: string) => errors[`${prefix}-${k}`];
  return (
    <Card>
      <CardBody className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{title}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" required value={party.name} onChange={(ev) => onChange({ name: ev.target.value })} error={e("name")} autoComplete="off" />
          <PhoneField label="Phone" required value={party.phone} country={party.country} onChange={(phone) => onChange({ phone })} error={e("phone")} />
          <Input label="Email" type="email" value={party.email} onChange={(ev) => onChange({ email: ev.target.value })} error={e("email")} hint="Optional" containerClassName="sm:col-span-2" />
        </div>
        <LocationPicker
          value={{ country: party.country, state: party.state, city: party.city }}
          onChange={(p) => onChange({ country: p.country, state: p.state, city: p.city })}
          lockedCountry={lockedCountry}
          hideLockedCountry={hideCountry}
          excludeCountries={excludeCountries}
          errors={{ country: e("country"), state: e("state"), city: e("city") }}
        />
        <Input label="Street address" required value={party.line1} onChange={(ev) => onChange({ line1: ev.target.value })} error={e("line1")} />
        <Input label="Apartment, suite or landmark" value={party.line2} onChange={(ev) => onChange({ line2: ev.target.value })} hint="Optional" />
        <Input label="Postcode" required={zipRequired} value={party.zip} onChange={(ev) => onChange({ zip: ev.target.value })} error={e("zip")} hint={zipRequired ? "The carrier needs this for international delivery" : prefix === "r" ? "If the area uses one" : "Optional"} containerClassName="max-w-xs" />
      </CardBody>
    </Card>
  );
}

function PackageStep({
  international,
  draft,
  errors,
  patch,
  patchParty,
  onNext,
}: StepCommon & {
  international: boolean;
  patchParty: (who: "sender" | "receiver", p: Partial<PartyForm>) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      <PartyFields
        prefix="s"
        title={international ? "Sender" : "Sender (in Nigeria)"}
        party={draft.sender}
        errors={errors}
        onChange={(p) => patchParty("sender", p)}
        lockedCountry="NG"
        hideCountry={international}
      />
      <PartyFields
        prefix="r"
        title="Receiver"
        party={draft.receiver}
        errors={errors}
        onChange={(p) => patchParty("receiver", p)}
        lockedCountry={international ? undefined : "NG"}
        excludeCountries={international ? ["NG"] : undefined}
        zipRequired={international}
      />
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">The package</h2>
          <Textarea label="What are you sending?" required value={draft.description} onChange={(e) => patch({ description: e.target.value })} error={errors.description} placeholder="e.g. Clothes and books" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Estimated weight (kg)" required type="number" inputMode="decimal" min="0.01" step="0.01" value={draft.weight} onChange={(e) => patch({ weight: e.target.value })} error={errors.weight} hint="We weigh it again at our office. The final price uses that weight, rounded up to the next whole kg." />
            <Input label="Declared value (NGN)" type="number" inputMode="decimal" min="0" value={draft.declaredValue} onChange={(e) => patch({ declaredValue: e.target.value })} hint="Optional" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Length (cm)" type="number" inputMode="decimal" min="0" value={draft.length} onChange={(e) => patch({ length: e.target.value })} />
            <Input label="Width (cm)" type="number" inputMode="decimal" min="0" value={draft.width} onChange={(e) => patch({ width: e.target.value })} />
            <Input label="Height (cm)" type="number" inputMode="decimal" min="0" value={draft.height} onChange={(e) => patch({ height: e.target.value })} />
          </div>
        </CardBody>
      </Card>
      <div className="flex justify-end">
        <Button size="lg" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}

/* ── Step 2: contents / customs ───────────────────────────────────────── */

function ContentsStep({
  international,
  draft,
  errors,
  patch,
  onBack,
  onNext,
}: StepCommon & { international: boolean; onBack: () => void; onNext: () => void }) {
  const setItem = (n: number, p: Partial<ItemForm>) => patch({ items: draft.items.map((it, i) => (i === n ? { ...it, ...p } : it)) });
  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
              {international ? "Customs: what is inside" : "What is inside"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {international
                ? "List each item with its value. The carrier uses this for customs. An HS code is optional."
                : "List the items, so the carrier has an accurate description. This is optional."}
            </p>
          </div>
          {errors.items ? <Alert tone="danger">{errors.items}</Alert> : null}
          {draft.items.map((it, n) => (
            <div key={n} className="space-y-3 rounded-sm border border-line p-4">
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                <Input label="Item" value={it.description} onChange={(e) => setItem(n, { description: e.target.value })} error={errors[`i-${n}-d`]} />
                <Input label="Quantity" type="number" min="1" value={it.quantity} onChange={(e) => setItem(n, { quantity: e.target.value })} error={errors[`i-${n}-q`]} />
                <Input label="Value each (NGN)" type="number" min="0" value={it.value} onChange={(e) => setItem(n, { value: e.target.value })} error={errors[`i-${n}-v`]} />
              </div>
              <div className="flex items-end justify-between gap-3">
                <Input label="HS code" value={it.hsCode} onChange={(e) => setItem(n, { hsCode: e.target.value })} error={errors[`i-${n}-h`]} hint="Optional" containerClassName="max-w-[11rem]" />
                {draft.items.length > 1 ? (
                  <button type="button" onClick={() => patch({ items: draft.items.filter((_, i) => i !== n) })} className="mb-1 text-sm font-semibold text-[var(--color-danger)] hover:underline">
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {draft.items.length < 30 ? (
            <button type="button" onClick={() => patch({ items: [...draft.items, blankItem()] })} className="text-sm font-semibold text-ink-soft hover:text-ink">
              + Add another item
            </button>
          ) : null}
        </CardBody>
      </Card>
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}

/* ── Step 3: handover ─────────────────────────────────────────────────── */

function HandoverStep({
  draft,
  errors,
  patch,
  config,
  officeLoc,
  onBack,
  onNext,
}: StepCommon & { config?: ShippingConfig; officeLoc: LocationDTO | null; onBack: () => void; onNext: () => void }) {
  const [quote, setQuote] = useState<QuoteDTO | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const mapKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || null;
  const pickupAvailable = Boolean(config?.pickupAvailable && officeLoc);
  const locKey = draft.pickupLoc ? (draft.pickupLoc.placeId ?? `${draft.pickupLoc.lat},${draft.pickupLoc.lng},${draft.pickupLoc.formattedAddress}`) : "";

  // Price the rider trip to our office with the existing pricing, at the standard fare.
  useEffect(() => {
    if (draft.method !== "pickup" || !draft.pickupLoc?.formattedAddress || !officeLoc) return;
    let cancelled = false;
    setQuoting(true);
    setQuoteError(null);
    http
      .post<QuoteDTO>("/api/bookings/quote", {
        pickup: draft.pickupLoc,
        stops: [],
        destination: officeLoc,
        deliveryType: "single",
        standardRate: true,
      })
      .then((q) => {
        if (cancelled) return;
        setQuote(q);
        if (draft.vehicleSlug && !q.vehicles.some((v) => v.vehicle.slug === draft.vehicleSlug && !v.soldOut)) {
          patch({ vehicleSlug: null });
        }
      })
      .catch((err) => !cancelled && setQuoteError(err instanceof HttpError ? err.message : "Could not price the pickup."))
      .finally(() => !cancelled && setQuoting(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.method, locKey]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">How do we get your package?</h2>
          {errors.method ? <Alert tone="danger">{errors.method}</Alert> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { v: "pickup" as const, t: "Rider pickup", d: "A rider collects it from you and brings it to our office. You pay a pickup fee now.", off: !pickupAvailable },
                { v: "dropoff" as const, t: "I will drop it off", d: "Bring your package to our office. No payment is needed yet.", off: false },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                disabled={o.off}
                onClick={() => patch({ method: o.v })}
                className={cn(
                  "rounded-sm border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                  draft.method === o.v ? "border-ink bg-ink/[0.03] ring-1 ring-ink" : "border-line-strong hover:border-ink",
                )}
              >
                <span className="block text-sm font-bold">{o.t}</span>
                <span className="mt-1 block text-xs text-muted">{o.off ? "Not available right now." : o.d}</span>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {draft.method === "dropoff" && config ? (
        <Card>
          <CardBody className="space-y-2 text-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Drop-off location</h2>
            {config.office.line1 ? (
              <>
                <p className="font-semibold">{[config.office.line1, config.office.line2, config.office.city, config.office.state].filter(Boolean).join(", ")}</p>
                <p className="text-muted">{config.office.openingHours}</p>
                {config.office.phone ? <p className="text-muted">{config.office.phone}</p> : null}
              </>
            ) : (
              <p className="text-muted">We will show you the office address as soon as you create the shipment.</p>
            )}
            <p className="text-muted">You will get a booking reference after the next step. Quote it when you drop your package off.</p>
          </CardBody>
        </Card>
      ) : null}

      {draft.method === "pickup" ? (
        <>
          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Pickup</h2>
              <AddressAutocomplete
                label="Pickup address"
                tone="pickup"
                required
                browserKey={mapKey}
                value={draft.pickupLoc}
                onChange={(loc) => patch({ pickupLoc: loc ? { ...loc, details: loc.details ?? draft.pickupLoc?.details } : null })}
                error={errors.pickup}
                placeholder="Where should the rider collect from?"
              />
              {draft.pickupLoc?.formattedAddress ? (
                <Input
                  label="House number, landmark or gate instructions"
                  required
                  value={draft.pickupLoc.details ?? ""}
                  onChange={(e) => patch({ pickupLoc: { ...draft.pickupLoc!, details: e.target.value } })}
                  error={errors.pickupDetails}
                />
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Pickup date" type="date" required min={today} value={draft.date} onChange={(e) => patch({ date: e.target.value })} error={errors.date} />
                <Input label="Pickup time" type="time" required value={draft.time} onChange={(e) => patch({ time: e.target.value })} error={errors.time} />
              </div>
              <Textarea label="Note for the rider" value={draft.notes} onChange={(e) => patch({ notes: e.target.value })} hint="Optional" />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Vehicle and pickup fee</h2>
              {errors.vehicle ? <Alert tone="danger" className="mt-3">{errors.vehicle}</Alert> : null}
              {!draft.pickupLoc?.formattedAddress ? (
                <p className="mt-3 text-sm text-muted">Enter the pickup address to see the fee.</p>
              ) : quoteError ? (
                <Alert tone="danger" className="mt-3">{quoteError}</Alert>
              ) : quoting && !quote ? (
                <div className="mt-3 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-sm" />)}</div>
              ) : (
                <div className="mt-3 space-y-3">
                  {quote?.vehicles.map(({ vehicle, price, soldOut }) => {
                    const active = draft.vehicleSlug === vehicle.slug;
                    return (
                      <button
                        key={vehicle.slug}
                        type="button"
                        disabled={soldOut}
                        onClick={() => patch({ vehicleSlug: vehicle.slug })}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-sm border p-3 text-left transition",
                          soldOut ? "cursor-not-allowed opacity-60" : active ? "border-ink bg-ink/[0.03] ring-1 ring-ink" : "border-line-strong hover:border-ink",
                        )}
                      >
                        <img src={vehicleImage(vehicle.slug)} alt="" className="size-16 shrink-0 rounded-sm bg-surface object-contain p-1" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">{vehicle.name}</p>
                          <p className="text-xs text-muted">{soldOut ? "Fully booked" : vehicle.capacity}</p>
                        </div>
                        <p className="text-lg font-bold font-mono tabular-nums">{formatNaira(price.total)}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      ) : null}

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}

/* ── Step 4 (international): carrier rates ─────────────────────────────── */

const ratesCache = new Map<string, RateEstimate>();

function RatesStep({ draft, patch, onBack, onNext }: StepCommon & { onBack: () => void; onNext: () => void }) {
  const hasDims = draft.length && draft.width && draft.height;
  const body = {
    shipmentType: "international",
    from: {
      country: draft.sender.country,
      state: draft.sender.state,
      city: draft.sender.city,
      zip: draft.sender.zip.trim() || undefined,
    },
    country: draft.receiver.country,
    state: draft.receiver.state,
    city: draft.receiver.city,
    zip: draft.receiver.zip.trim() || undefined,
    weightKg: Number(draft.weight),
    dimensions: hasDims ? { lengthCm: Number(draft.length), widthCm: Number(draft.width), heightCm: Number(draft.height) } : undefined,
  };
  const key = JSON.stringify(body);
  const [state, setState] = useState<{ loading: boolean; error?: string; data?: RateEstimate }>(() => ({ loading: !ratesCache.has(key), data: ratesCache.get(key) }));
  const [attempt, setAttempt] = useState(0);
  const [pickError, setPickError] = useState<string | null>(null);

  useEffect(() => {
    const cached = ratesCache.get(key);
    if (cached && attempt === 0) {
      setState({ loading: false, data: cached });
      return;
    }
    let cancelled = false;
    setState({ loading: true });
    http
      .post<RateEstimate>("/api/shipments/estimate", body)
      .then((data) => {
        ratesCache.set(key, data);
        if (!cancelled) setState({ loading: false, data });
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, error: err instanceof HttpError ? err.message : "We could not get carrier rates right now." });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const options = state.data?.options ?? [];
  // A carrier chosen earlier is dropped if it is no longer offered for this route and weight.
  useEffect(() => {
    if (state.data && draft.carrier && !options.some((o) => o.carrierName === draft.carrier)) patch({ carrier: null, carrierTotal: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data]);

  const canSkip = !state.loading && (Boolean(state.error) || Boolean(state.data?.manualRequired) || options.length === 0);

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Choose a carrier</h2>
            <p className="text-sm text-muted">
              Prices for {draft.weight} kg from {draft.sender.city} to {draft.receiver.city}, {regionName(draft.receiver.country)}.
            </p>
          </div>

          {state.loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <p className="text-sm text-muted">Getting live carrier rates. This can take a few seconds.</p>
            </div>
          ) : null}

          {state.error ? (
            <Alert tone="warning" title="Could not get rates">
              <p>{state.error}</p>
              <Button className="mt-3" size="sm" variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </Button>
            </Alert>
          ) : null}

          {state.data?.manualRequired ? (
            <Alert tone="info" title="Heavy shipment">
              Parcels this heavy are priced individually. Continue, and we will send you the price after your package is weighed at our office.
            </Alert>
          ) : null}
          {state.data && !state.data.manualRequired && options.length === 0 ? (
            <Alert tone="warning">No carrier rates were found for this route. You can still continue and we will quote you after your package is weighed.</Alert>
          ) : null}

          {options.length > 0 ? (
            <div role="radiogroup" aria-label="Carrier" className="space-y-3">
              {options.map((o) => {
                const on = draft.carrier === o.carrierName;
                return (
                  <button
                    key={o.rateId}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setPickError(null);
                      patch({ carrier: o.carrierName, carrierTotal: o.total });
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition",
                      on ? "border-ink bg-ink/[0.03] ring-1 ring-ink" : "border-line-strong hover:border-ink",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {o.carrierLogo ? <img src={o.carrierLogo} alt="" className="size-9 shrink-0 rounded-sm object-contain" loading="lazy" /> : null}
                      <span className="min-w-0">
                        <span className="block truncate font-bold">{o.carrierName}</span>
                        {o.deliveryTime ? <span className="block text-xs text-muted">{o.deliveryTime}</span> : null}
                      </span>
                    </span>
                    <span className="shrink-0 text-lg font-bold font-mono tabular-nums">{formatNaira(o.total)}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {pickError ? <p className="text-xs font-medium text-[var(--color-danger)]">{pickError}</p> : null}

          {options.length > 0 ? (
            <Alert tone="warning" title="If the weight is different">
              This price uses the {draft.weight} kg you entered. When we weigh your package at our office, if it is heavier you will be asked to pay the additional fee before it ships. If it weighs the same or less, you pay nothing more.
            </Alert>
          ) : null}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button
          size="lg"
          disabled={state.loading}
          onClick={() => {
            if (options.length > 0 && !draft.carrier && !canSkip) {
              setPickError("Choose a carrier to continue");
              return;
            }
            onNext();
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

/* ── Step 4: review ───────────────────────────────────────────────────── */

function ReviewStep({
  international,
  draft,
  errors,
  patch,
  config,
  submitting,
  submitError,
  onBack,
  onSubmit,
}: StepCommon & {
  international: boolean;
  config?: ShippingConfig;
  submitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const line = (p: PartyForm) => [p.line1, p.city, p.state, p.country].filter(Boolean).join(", ");
  const countryLabel = draft.receiver.country ? regionName(draft.receiver.country) : undefined;
  return (
    <div className="space-y-5">
      {international ? (
        <Alert tone="info" title={draft.carrier ? `Shipping with ${draft.carrier}${draft.carrierTotal ? `: ${formatNaira(draft.carrierTotal)}` : ""}` : "You can pay straight away"}>
          {draft.carrier
            ? draft.method === "pickup"
              ? "After you create the shipment you pay the rider's pickup fee, then pay for shipping on the next page. "
              : "After you create the shipment you go straight to paying for shipping. "
            : "After you submit, you will see the carrier prices and can pay right away. "}
          The price uses the weight you entered ({draft.weight || "?"} kg). When we weigh your package at our office, if the weight is different and higher, you will be asked to pay the additional fee before it ships.
        </Alert>
      ) : null}
      <Card>
        <CardBody className="space-y-4 text-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Review your shipment</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="rule-label">From</p>
              <p className="mt-1 font-semibold">{draft.sender.name}</p>
              <p className="text-muted">{line(draft.sender)}</p>
            </div>
            <div>
              <p className="rule-label">To</p>
              <p className="mt-1 font-semibold">{draft.receiver.name}</p>
              <p className="text-muted">
                {line({ ...draft.receiver, country: countryLabel ?? draft.receiver.country })}
              </p>
            </div>
          </div>
          <div className="border-t border-line pt-3">
            <p>
              <span className="text-muted">Package:</span> {draft.description}
            </p>
            <p>
              <span className="text-muted">Estimated weight:</span> {draft.weight} kg
            </p>
            <p>
              <span className="text-muted">Handover:</span>{" "}
              {draft.method === "pickup" ? `Rider pickup from ${draft.pickupLoc?.formattedAddress}` : "You drop it off at our office"}
            </p>
          </div>
          <Alert tone="info">
            We will weigh and measure your package at our office. Your delivery price is based on that weight, rounded up to the next whole kilogram, and we send you the options to choose from. You only pay for shipping after you pick one.
          </Alert>
          {international && config ? <Alert tone="warning">{config.dutiesNotice}</Alert> : null}
          {draft.method === "pickup" && config ? (
            <div className="rounded-sm border border-line bg-surface p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Pickup fee refund policy</p>
              <p className="mt-1 whitespace-pre-line text-xs text-muted">{config.refundPolicyText}</p>
            </div>
          ) : null}
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 size-4" checked={draft.agreed} onChange={(e) => patch({ agreed: e.target.checked })} />
            <span>
              {draft.method === "pickup"
                ? "I have read the refund policy and I am ready to pay the pickup fee."
                : "I understand I need to bring the package to the office and quote my reference."}
            </span>
          </label>
          {errors.agreed ? <p className="text-xs font-medium text-[var(--color-danger)]">{errors.agreed}</p> : null}
        </CardBody>
      </Card>
      {submitError ? <Alert tone="danger">{submitError}</Alert> : null}
      <DisclaimerNotice paragraphs={config?.disclaimerParagraphs} />
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button size="lg" onClick={onSubmit} loading={submitting}>
          {draft.method === "pickup"
            ? "Create shipment and pay pickup fee"
            : international && draft.carrier
              ? "Create shipment and pay for shipping"
              : "Create shipment"}
        </Button>
      </div>
    </div>
  );
}
