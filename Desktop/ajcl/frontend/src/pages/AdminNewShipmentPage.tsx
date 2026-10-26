import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import { toInternationalPhone, phoneProblem } from "@/lib/phone";
import { PartyFields, blankParty, blankItem, type PartyForm, type ItemForm } from "@/pages/ShipmentWizardPage";
import type { Shipment } from "@/types/shipping";
import { ITEM_CURRENCIES } from "@/config/shipping";

type Type = "interstate" | "international";

/** Staff create a shipment with no payment. It is saved in Terminal as a draft, and booked later from its page. */
export function AdminNewShipmentPage() {
  useDocumentTitle("New shipment");
  const toast = useToast();
  const navigate = useNavigate();
  const [type, setType] = useState<Type>("interstate");
  const [customerEmail, setCustomerEmail] = useState("");
  const [sender, setSender] = useState<PartyForm>(blankParty("NG"));
  const [receiver, setReceiver] = useState<PartyForm>(blankParty("NG"));
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [dims, setDims] = useState({ l: "", w: "", h: "" });
  const [declaredValue, setDeclaredValue] = useState("");
  const [items, setItems] = useState<ItemForm[]>([blankItem()]);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const international = type === "international";

  const patchItem = (n: number, p: Partial<ItemForm>) => setItems(items.map((it, i) => (i === n ? { ...it, ...p } : it)));

  function switchType(next: Type) {
    setType(next);
    setReceiver(blankParty(next === "interstate" ? "NG" : ""));
    setSender(blankParty(next === "interstate" ? "NG" : ""));
    setErrors({});
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    const need = (k: string, v: string, m = "Required") => {
      if (!v.trim()) e[k] = m;
    };
    need("s-name", sender.name);
    if (!toInternationalPhone(sender.phone, sender.country, { strict: true })) e["s-phone"] = phoneProblem(sender.country);
    need("s-line1", sender.line1, "Enter the street address");
    need("s-city", sender.city);
    need("s-state", sender.state);
    if (international && !sender.country) e["s-country"] = "Choose a country";
    need("r-name", receiver.name);
    if (!toInternationalPhone(receiver.phone, receiver.country, { strict: true })) e["r-phone"] = phoneProblem(receiver.country);
    need("r-line1", receiver.line1, "Enter the street address");
    need("r-city", receiver.city);
    need("r-state", receiver.state);
    if (international && !receiver.country) e["r-country"] = "Choose a country";
    if (international && !receiver.zip.trim()) e["r-zip"] = "Enter the postcode";
    if (description.trim().length < 3) e.description = "Describe the package";
    if (international && !(Number(dims.l) > 0 && Number(dims.w) > 0 && Number(dims.h) > 0)) e.dims = "Enter the length, width and height. International rates depend on the size";
    if (!(Number(weight) >= 0.01)) e.weight = "Enter the weight in kg";
    if (international && !items.some((i) => i.description.trim())) e.items = "List what is in the package (needed for customs)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setBusy(true);
    setFailure(null);
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
    try {
      const res = await http.post<{ shipment: Shipment; draftWarning: string | null }>("/api/office/shipments", {
        shipmentType: type,
        customerEmail: customerEmail.trim() || undefined,
        sender: party(sender),
        receiver: party(receiver),
        parcel: {
          description: description.trim(),
          estimatedWeightKg: Number(weight),
          dimensions: dims.l && dims.w && dims.h ? { lengthCm: Number(dims.l), widthCm: Number(dims.w), heightCm: Number(dims.h) } : undefined,
          declaredValue: Number(declaredValue) || 0,
          items: items
            .filter((i) => i.description.trim())
            .map((i) => ({ description: i.description.trim(), quantity: Number(i.quantity) || 1, value: Number(i.value) || 0, currency: i.currency, hsCode: i.hsCode.trim() || undefined })),
        },
        note: note.trim() || undefined,
      });
      if (res.draftWarning) toast.error("Saved here, but not fully in Terminal yet", res.draftWarning);
      else toast.success("Shipment created and saved in Terminal as a draft");
      navigate(`/admin/shipments/${res.shipment.reference}`);
    } catch (err) {
      setFailure(err instanceof HttpError ? err.message : "Could not create the shipment. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/admin/shipments" className="text-sm font-semibold text-muted hover:text-ink">
          ← Shipments desk
        </Link>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">New shipment</h1>
        <p className="text-sm text-muted">
          For a customer at the desk or on the phone. Nothing is charged online: it is saved in Terminal as a draft and the carrier rates are fetched, ready to book.
        </p>
      </div>

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Select label="Type" value={type} onChange={(e) => switchType(e.target.value as Type)}>
            <option value="interstate">Interstate (within Nigeria)</option>
            <option value="international">International</option>
          </Select>
          <Input label="Customer email (optional)" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} hint="Puts it on their account so they can follow it. Leave empty to keep it on yours." />
        </CardBody>
      </Card>

      <PartyFields prefix="s" title="Sender" party={sender} errors={errors} onChange={(p) => setSender({ ...sender, ...p })} lockedCountry={international ? undefined : "NG"} hideCountry={!international} />
      <PartyFields
        prefix="r"
        title="Receiver"
        party={receiver}
        errors={errors}
        onChange={(p) => setReceiver({ ...receiver, ...p })}
        lockedCountry={international ? undefined : "NG"}
        zipRequired={international}
      />

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">The package</h2>
          <Textarea label="What is it?" required value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Weight (kg)" required type="number" min="0.01" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} error={errors.weight} hint="The real weight. It is rounded up to the next whole kilogram." />
            <Input label="Declared value (NGN)" type="number" min="0" value={declaredValue} onChange={(e) => setDeclaredValue(e.target.value)} hint="Optional" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Length (cm)" required={international} type="number" min="0" value={dims.l} onChange={(e) => setDims({ ...dims, l: e.target.value })} />
            <Input label="Width (cm)" required={international} type="number" min="0" value={dims.w} onChange={(e) => setDims({ ...dims, w: e.target.value })} />
            <Input label="Height (cm)" required={international} type="number" min="0" value={dims.h} onChange={(e) => setDims({ ...dims, h: e.target.value })} />
          </div>

          <div className="space-y-3 border-t border-line pt-4">
            <h3 className="text-sm font-bold">Contents{international ? " (needed for customs)" : " (optional)"}</h3>
            {items.map((it, n) => (
              <div key={n} className="grid gap-3 sm:grid-cols-[2fr_5rem_7rem_6rem_7rem_auto]">
                <Input aria-label="Item" placeholder="Item" value={it.description} onChange={(e) => patchItem(n, { description: e.target.value })} />
                <Input aria-label="Quantity" type="number" min="1" value={it.quantity} onChange={(e) => patchItem(n, { quantity: e.target.value })} />
                <Input aria-label="Value of one" placeholder="Value" type="number" min="0" value={it.value} onChange={(e) => patchItem(n, { value: e.target.value })} />
                <Select aria-label="Currency" value={it.currency} onChange={(e) => patchItem(n, { currency: e.target.value })}>
                  {ITEM_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <Input aria-label="HS code" placeholder="HS code" value={it.hsCode} onChange={(e) => patchItem(n, { hsCode: e.target.value })} />
                {items.length > 1 ? (
                  <button type="button" className="text-sm font-semibold text-[var(--color-danger)] hover:underline" onClick={() => setItems(items.filter((_, i) => i !== n))}>
                    Remove
                  </button>
                ) : (
                  <span />
                )}
              </div>
            ))}
            {errors.dims ? <p className="text-xs font-medium text-[var(--color-danger)]">{errors.dims}</p> : null}
            {errors.items ? <p className="text-xs font-medium text-[var(--color-danger)]">{errors.items}</p> : null}
            <button type="button" className="text-sm font-semibold text-ink-soft hover:text-ink" onClick={() => setItems([...items, blankItem()])}>
              + Add an item
            </button>
          </div>

          <Textarea label="Internal note (optional)" value={note} onChange={(e) => setNote(e.target.value)} hint="Only staff see this" className="min-h-20" />
        </CardBody>
      </Card>

      {failure ? <Alert tone="danger">{failure}</Alert> : null}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" href="/admin/shipments">
          Cancel
        </Button>
        <Button size="lg" onClick={submit} loading={busy}>
          Create and save in Terminal
        </Button>
      </div>
    </div>
  );
}
