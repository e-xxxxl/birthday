import { useEffect, useState } from "react";
import { Alert, LoadingBlock } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { http, HttpError } from "@/lib/http";
import { formatNaira } from "@/lib/utils";

type Settings = { enabled: boolean; thresholdKm: number; flatNgn: number; perKmNgn: number; updatedByName?: string; updatedAt?: string };

/**
 * Super Admin only: an extra fee on rider deliveries (the /book flow) that go further than a set distance. It is added
 * into the customer's total and is never shown to them, or to other admins; only the Super Admin sees it on a booking.
 */
export function LongDistanceFeeCard() {
  const toast = useToast();
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ enabled: false, thresholdKm: "", flatNgn: "", perKmNgn: "" });
  const [meta, setMeta] = useState<{ by?: string; at?: string }>({});

  useEffect(() => {
    let live = true;
    http
      .get<{ longDistance: Settings }>("/api/admin/rides/long-distance")
      .then((r) => {
        if (!live) return;
        const s = r.longDistance;
        setForm({ enabled: s.enabled, thresholdKm: s.thresholdKm ? String(s.thresholdKm) : "", flatNgn: s.flatNgn ? String(s.flatNgn) : "", perKmNgn: s.perKmNgn ? String(s.perKmNgn) : "" });
        setMeta({ by: s.updatedByName, at: s.updatedAt });
        setLoaded(true);
      })
      .catch((err) => live && setError(err instanceof HttpError ? err.message : "Could not load this setting."));
    return () => {
      live = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const r = await http.put<{ longDistance: Settings }>("/api/admin/rides/long-distance", {
        enabled: form.enabled,
        thresholdKm: Number(form.thresholdKm) || 0,
        flatNgn: Number(form.flatNgn) || 0,
        perKmNgn: Number(form.perKmNgn) || 0,
      });
      setMeta({ by: r.longDistance.updatedByName, at: r.longDistance.updatedAt });
      toast.success("Saved", form.enabled ? "The fee applies to rides booked from now on." : "The long-distance fee is switched off.");
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const threshold = Number(form.thresholdKm) || 0;
  const example = threshold > 0 ? threshold + 10 : 0;
  const exampleFee = threshold > 0 ? (Number(form.flatNgn) || 0) + (Number(form.perKmNgn) || 0) * (example - threshold) : 0;

  return (
    <Card>
      <CardHeader
        title="Long-distance fee"
        description="An extra fee on rider deliveries that go further than a set distance. Only you can set it, and only you see it."
      />
      <CardBody className="space-y-4">
        {!loaded && !error ? <LoadingBlock /> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {loaded ? (
          <>
            <Alert tone="info">
              It applies to rider deliveries booked on the Book a ride flow, from now on. It does not apply to the rider pickup of a shipment. Customers never see it: it is added into the total they pay, with no separate line. Other admins do not see it either. You see it on each booking.
            </Alert>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" className="size-4" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
              Charge an extra fee on long deliveries
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Starts after (km)" type="number" min="0" step="0.1" value={form.thresholdKm} onChange={(e) => setForm({ ...form, thresholdKm: e.target.value })} hint="Deliveries longer than this" />
              <Input label="Flat extra fee (NGN)" type="number" min="0" value={form.flatNgn} onChange={(e) => setForm({ ...form, flatNgn: e.target.value })} hint="Added once" />
              <Input label="Extra per km beyond (NGN)" type="number" min="0" value={form.perKmNgn} onChange={(e) => setForm({ ...form, perKmNgn: e.target.value })} hint="Optional, for each km past the distance" />
            </div>
            {form.enabled && threshold > 0 && exampleFee > 0 ? (
              <p className="text-sm text-muted">
                Example: a {example} km delivery carries an extra {formatNaira(exampleFee)}. A delivery of {threshold} km or less carries none.
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={save} loading={saving}>
                Save
              </Button>
              {meta.by ? <span className="text-xs text-muted">Last set by {meta.by}{meta.at ? ` on ${new Date(meta.at).toLocaleDateString("en-NG")}` : ""}</span> : null}
            </div>
          </>
        ) : null}
      </CardBody>
    </Card>
  );
}
