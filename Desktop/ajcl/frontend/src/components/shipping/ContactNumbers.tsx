import { useState } from "react";
import { Alert } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { PhoneField } from "@/components/shipping/PhoneField";
import { http, HttpError } from "@/lib/http";
import { regionName } from "@/lib/utils";
import type { Shipment } from "@/types/shipping";

/**
 * The sender's and receiver's phone numbers, with a way to correct one until the carrier has the shipment. A corrected
 * number replaces the old one everywhere, so the carrier is only ever sent the new one. `base` is the API path of the
 * shipment's owner ("/api/shipments") or of staff ("/api/office/shipments").
 */
export function ContactNumbers({ shipment, base, onUpdated }: { shipment: Shipment; base: string; onUpdated: (s: Shipment) => void }) {
  const toast = useToast();
  const [editing, setEditing] = useState<"sender" | "receiver" | null>(null);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editable = shipment.contactEditable !== false;
  if (!editable && !shipment.addressProblem) return null;

  async function save(who: "sender" | "receiver") {
    setSaving(true);
    setError(null);
    try {
      const res = await http.post<{ shipment: Shipment }>(`${base}/${shipment.reference}/contact`, { who, phone });
      onUpdated(res.shipment);
      setEditing(null);
      toast.success("Number updated", res.shipment.addressProblem ? res.shipment.addressProblem : "The new number will be used from now on.");
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not update the number. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const rows: { who: "sender" | "receiver"; label: string }[] = [
    { who: "sender", label: "Sender" },
    { who: "receiver", label: "Receiver" },
  ];

  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">Phone numbers</h2>
          <p className="text-sm text-muted">The carrier needs a working number for the sender and the receiver. You can correct one until the shipment is booked.</p>
        </div>

        {shipment.addressProblem ? (
          <Alert tone="warning" title="Please correct this">
            {shipment.addressProblem}
          </Alert>
        ) : null}

        <ul className="divide-y divide-line">
          {rows.map(({ who, label }) => {
            const p = shipment[who];
            const open = editing === who;
            return (
              <li key={who} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">
                      {label} · {p.name}
                    </p>
                    <p className="font-mono">{p.phone}</p>
                    <p className="text-xs text-muted">{regionName(p.country)}</p>
                  </div>
                  {editable && !open ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditing(who);
                        setPhone(p.phone);
                        setError(null);
                      }}
                    >
                      Change number
                    </Button>
                  ) : null}
                </div>
                {open ? (
                  <div className="mt-3 space-y-3">
                    <PhoneField label={`${label}'s new number`} required value={phone} country={p.country} onChange={setPhone} />
                    {error ? <Alert tone="danger">{error}</Alert> : null}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => save(who)} disabled={saving || !phone}>
                        {saving ? "Checking…" : "Save number"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
