import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { http, HttpError } from "@/lib/http";
import { formatNaira } from "@/lib/utils";
import type { BookingDTO } from "@/types";

/**
 * Change what a partner order bills: waive a returned order, agree a special price.
 * Only for orders billed on a partner's account. The original amount is kept on record.
 */
export function AdminAmountPanel({ booking, onChanged }: { booking: BookingDTO; onChanged?: () => void }) {
  const toast = useToast();
  const [total, setTotal] = useState(String(booking.pricing.total));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (booking.payment.status !== "on_account" || booking.status === "cancelled") return null;

  const n = Number(total);
  const valid = total.trim() !== "" && Number.isFinite(n) && n >= 0;
  const changed = valid && n !== booking.pricing.total;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await http.patch(`/api/admin/bookings/${booking.bookingReference}/amount`, { total: n, note });
      toast.success("Amount updated", `This order now bills ${formatNaira(n)}.`);
      setNote("");
      onChanged?.();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not update the amount.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Partner billing"
        description={`Billed to the partner's account at ${formatNaira(booking.pricing.total)}.`}
      />
      <CardBody className="space-y-3">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {booking.status === "returned" ? (
          <Alert tone="warning">
            This order was returned. It stays on the partner&apos;s bill unless you change the amount (set it to 0 to
            waive it).
          </Alert>
        ) : null}
        <Input
          label="Amount billed (₦)"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
        <Input
          label="Reason"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Agreed special rate, return fee only"
          hint="Required. Kept with the order for your records."
        />
        <Button size="sm" loading={saving} disabled={!changed || note.trim().length < 3} onClick={save}>
          Update amount
        </Button>
      </CardBody>
    </Card>
  );
}
