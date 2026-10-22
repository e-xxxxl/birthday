import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { http, HttpError } from "@/lib/http";
import { formatDateTime } from "@/lib/utils";
import { isFundedPayment } from "@/config/booking";
import type { BookingDTO } from "@/types";

/** Read-only view of the pickup/delivery handover codes' status — never the codes
 *  themselves — with a reset action if a code got locked from too many wrong tries. */
export function AdminHandoverPanel({ booking, onChanged }: { booking: BookingDTO; onChanged?: () => void }) {
  const toast = useToast();
  const [resetting, setResetting] = useState<"pickup" | "delivery" | null>(null);

  if (!isFundedPayment(booking.payment.status) || booking.status === "cancelled") return null;
  const h = booking.handover;
  if (!h) return null;

  async function reset(stage: "pickup" | "delivery") {
    setResetting(stage);
    try {
      await http.post(`/api/admin/bookings/${booking.bookingReference}/handover/reset`, { stage });
      toast.success(`${stage === "pickup" ? "Pickup" : "Delivery"} code unlocked`);
      onChanged?.();
    } catch (err) {
      toast.error("Could not reset the code", err instanceof HttpError ? err.message : "");
    } finally {
      setResetting(null);
    }
  }

  return (
    <Card>
      <CardHeader title="Handover codes" description="Never shown here — only to the sender and receiver." />
      <CardBody className="grid gap-4 sm:grid-cols-2">
        <Row
          label="Pickup code"
          usedAt={h.pickupUsedAt}
          locked={h.pickupLocked}
          onReset={() => reset("pickup")}
          resetting={resetting === "pickup"}
        />
        <Row
          label="Delivery code"
          usedAt={h.deliveryUsedAt}
          locked={h.deliveryLocked}
          onReset={() => reset("delivery")}
          resetting={resetting === "delivery"}
        />
      </CardBody>
    </Card>
  );
}

function Row({
  label,
  usedAt,
  locked,
  onReset,
  resetting,
}: {
  label: string;
  usedAt?: string;
  locked: boolean;
  onReset: () => void;
  resetting: boolean;
}) {
  return (
    <div className="rounded-sm bg-surface p-3 text-sm">
      <p className="rule-label">{label}</p>
      {usedAt ? (
        <p className="mt-1 font-semibold text-[var(--color-success)]">
          ✓ Verified {formatDateTime(usedAt)}
        </p>
      ) : locked ? (
        <div className="mt-1 space-y-2">
          <p className="font-semibold text-[var(--color-danger)]">Locked — too many wrong attempts</p>
          <Button size="sm" variant="secondary" loading={resetting} onClick={onReset}>
            Unlock
          </Button>
        </div>
      ) : (
        <p className="mt-1 text-muted">Not used yet</p>
      )}
    </div>
  );
}
