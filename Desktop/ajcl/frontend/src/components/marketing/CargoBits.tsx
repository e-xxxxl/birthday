import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Alert } from "@/components/ui/Feedback";
import { Input, Textarea } from "@/components/ui/Field";
import { apiUrl, http, HttpError } from "@/lib/http";
import type { SiteDocument } from "@/types/shipping";

/** The rate card or document the Super Admin uploaded for a cargo page: an image shown in full, or a PDF. */
export function RateCard({ doc, title, emptyText }: { doc: SiteDocument | null; title: string; emptyText: string }) {
  if (!doc) {
    return (
      <div className="grid min-h-[18rem] place-items-center rounded-3xl bg-surface p-10 text-center">
        <div>
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-sky-soft text-info">
            <Icon name="tag" className="size-8" />
          </span>
          <p className="mt-5 text-lg font-bold">{title} is not up yet</p>
          <p className="mt-2 text-sm text-muted">{emptyText}</p>
        </div>
      </div>
    );
  }
  const isPdf = doc.contentType === "application/pdf";
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-line bg-surface p-3 shadow-card">
        {isPdf ? (
          <object data={apiUrl(doc.url)} type="application/pdf" className="h-[34rem] w-full rounded-2xl">
            <p className="p-6 text-sm text-muted">Your browser cannot show this PDF here. Use the download button.</p>
          </object>
        ) : (
          <a href={apiUrl(doc.url)} target="_blank" rel="noreferrer" aria-label={`Open ${title} full size`}>
            <img src={apiUrl(doc.url)} alt={title} className="mx-auto max-h-[40rem] w-auto rounded-2xl" />
          </a>
        )}
      </div>
      <Button href={apiUrl(doc.downloadUrl)} variant="secondary" download={doc.filename}>
        Download {title.toLowerCase()}
      </Button>
    </div>
  );
}

/** The compliance notes shown with the enquiry form. */
export function CargoNotes({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;
  return (
    <div className="rounded-3xl border border-accent/30 bg-accent-soft p-6 text-sm leading-relaxed text-ink-soft">
      <p className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
        <Icon name="shield" className="size-5 text-accent-dark" />
        Please note
      </p>
      <div className="space-y-3">
        {notes.map((n) => (
          <p key={n}>{n}</p>
        ))}
      </div>
    </div>
  );
}

type Fields = { fullName: string; address: string; email: string; phone: string; destination: string; items: string };
const EMPTY: Fields = { fullName: "", address: "", email: "", phone: "", destination: "", items: "" };

/** The Air Cargo / Sea Cargo contact form. It goes to the office inbox. */
export function CargoEnquiryForm({ service }: { service: "air" | "sea" | "express" }) {
  const [form, setForm] = useState<Fields>(EMPTY);
  const [website, setWebsite] = useState(""); // hidden honeypot
  const [ack, setAck] = useState(false);
  const [ackError, setAckError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  function validate(): Partial<Record<keyof Fields, string>> {
    const e: Partial<Record<keyof Fields, string>> = {};
    if (form.fullName.trim().length < 2) e.fullName = "Enter your full name";
    if (form.address.trim().length < 5) e.address = "Enter your address";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Enter a valid email address";
    if (!/^[+\d][\d\s()-]{6,24}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number";
    if (form.destination.trim().length < 2) e.destination = "Enter the destination";
    if (form.items.trim().length < 3) e.items = "List the items you want to ship";
    return e;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFailure(null);
    const e = validate();
    setErrors(e);
    const needsAck = service !== "express" && !ack;
    setAckError(needsAck ? "Please tick the box to confirm you have read this" : null);
    if (Object.keys(e).length > 0 || needsAck) return;
    setSending(true);
    try {
      await http.post("/api/site/cargo-enquiry", { service, ...form, website });
      setSent(true);
      setForm(EMPTY);
      setAck(false);
    } catch (err) {
      if (err instanceof HttpError && err.details) {
        const next: Partial<Record<keyof Fields, string>> = {};
        for (const [k, v] of Object.entries(err.details)) if (k in EMPTY && v[0]) next[k as keyof Fields] = v[0];
        setErrors(next);
      }
      setFailure(err instanceof HttpError ? err.message : "We could not send your request. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-3xl bg-surface p-8 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-white">
          <Icon name="check" className="size-8" />
        </span>
        <h3 className="mt-5 text-2xl font-bold">Thank you, we have your request</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">Our team will review it and reply to you by email or phone.</p>
        <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-3xl border border-line bg-paper p-6 shadow-card sm:p-8">
      <div>
        <h3 className="text-2xl font-bold">
          {service === "express" ? "Ask about AJCL Express" : `Request a ${service === "air" ? "air" : "sea"} cargo quote`}
        </h3>
        <p className="mt-1 text-sm text-muted">Tell us what you want to ship and where. We will get back to you.</p>
      </div>

      {failure ? <Alert tone="danger">{failure}</Alert> : null}

      <Input label="Full name" required value={form.fullName} onChange={set("fullName")} error={errors.fullName} autoComplete="name" maxLength={120} />
      <Input label="Address" required value={form.address} onChange={set("address")} error={errors.address} autoComplete="street-address" maxLength={300} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email" type="email" required value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" maxLength={200} />
        <Input label="Phone number" type="tel" required value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" maxLength={30} />
      </div>
      <Input label="Destination" required value={form.destination} onChange={set("destination")} error={errors.destination} hint="City and country" maxLength={160} />
      <Textarea
        label="List of items"
        required
        value={form.items}
        onChange={set("items")}
        error={errors.items}
        hint="One item per line, with quantity and weight if you know them"
        className="min-h-32"
        maxLength={3000}
      />

      {service !== "express" ? (
        <div>
          <label className="flex items-start gap-3 rounded-2xl bg-surface p-3 text-sm">
            <input type="checkbox" required className="mt-1 size-4 shrink-0" checked={ack} onChange={(e) => { setAck(e.target.checked); if (e.target.checked) setAckError(null); }} />
            <span>
              I understand that before my shipment is finalised and payment made, I will need to fill the export goods declaration form, and that a completely filled and signed form with the terms and conditions agreed validates a successful shipment.
              <span className="ml-0.5 text-[var(--color-danger)]">*</span>
            </span>
          </label>
          {ackError ? <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">{ackError}</p> : null}
        </div>
      ) : null}

      {/* Honeypot: people never see or fill this, bots do. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <Button type="submit" size="lg" fullWidth loading={sending} arrow>
        Send request
      </Button>
    </form>
  );
}
