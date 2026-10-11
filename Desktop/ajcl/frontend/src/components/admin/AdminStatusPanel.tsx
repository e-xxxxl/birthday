import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { http, HttpError } from "@/lib/http";
import { BOOKING_STATUS_FLOW, BOOKING_STATUS_META } from "@/config/booking";
import type { BookingDTO } from "@/types";

// "driver_assigned", "in_transit" and "delivered" are reached via the "Assign
// rider" action and the rider's pickup/delivery code scans — not this control.
// They're still reachable here with the override toggle, for emergencies.
const NEXT: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  driver_assigned: ["cancelled"],
  in_transit: ["cancelled"],
  delivered: [],
  cancelled: [],
};

const ALL_STATUSES: string[] = [...BOOKING_STATUS_FLOW, "cancelled"];

function labelFor(s: string): string {
  return BOOKING_STATUS_META[s as keyof typeof BOOKING_STATUS_META]?.label ?? s;
}

export function AdminStatusPanel({
  booking,
  onChanged,
}: {
  booking: BookingDTO;
  onChanged?: () => void;
}) {
  const toast = useToast();

  const [force, setForce] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The statuses that can be picked, given the current booking state + override.
  const options = useMemo(() => {
    const next = NEXT[booking.status] ?? [];
    return force ? ALL_STATUSES.filter((s) => s !== booking.status) : next;
  }, [booking.status, force]);

  const [status, setStatus] = useState(options[0] ?? "");

  // Keep the selected status valid whenever the option set changes (after an
  // update lands, or when the override toggle flips).
  useEffect(() => {
    setStatus((cur) => (options.includes(cur) ? cur : options[0] ?? ""));
  }, [options]);

  const noMoves = options.length === 0;

  async function submit() {
    if (!status || status === booking.status) return;
    setLoading(true);
    setError(null);
    try {
      await http.patch(`/api/admin/bookings/${booking.bookingReference}/status`, {
        status,
        note: note.trim() || undefined,
        force,
      });
      toast.success("Status updated", `Booking is now ${labelFor(status)}.`);
      setNote("");
      onChanged?.();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not update the status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Update status" description={`Current: ${labelFor(booking.status)}`} />
      <CardBody className="space-y-3">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        {noMoves && !force ? (
          <p className="text-sm text-muted">
            This booking is {booking.status}. Turn on override to change it anyway.
          </p>
        ) : null}

        <Select label="New status" value={status} onChange={(e) => setStatus(e.target.value)}>
          {noMoves ? <option value="">No transitions available</option> : null}
          {options.map((s) => (
            <option key={s} value={s}>
              {labelFor(s)}
            </option>
          ))}
        </Select>

        <Textarea
          label="Note (shown in history)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />

        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
            className="size-4 rounded border-line-strong accent-[var(--color-ink)]"
          />
          Override transition rules
        </label>

        <Button fullWidth loading={loading} disabled={!status || status === booking.status} onClick={submit}>
          Apply update
        </Button>
      </CardBody>
    </Card>
  );
}
