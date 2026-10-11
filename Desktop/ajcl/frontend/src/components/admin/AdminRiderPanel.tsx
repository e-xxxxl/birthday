import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/Toast";
import { http, HttpError } from "@/lib/http";
import type { BookingDTO, RiderAccount } from "@/types";

/**
 * Assign a registered rider to a booking — the primary path. Falls back to a
 * manual name/phone/plate entry for a one-off dispatch with no rider account
 * (only available while no registered rider is linked).
 */
export function AdminRiderPanel({
  booking,
  onChanged,
}: {
  booking: BookingDTO;
  onChanged?: () => void;
}) {
  const toast = useToast();
  const terminal = booking.status === "delivered" || booking.status === "cancelled";
  const canAssign = booking.status === "confirmed" || booking.status === "driver_assigned";
  const pickedUp = Boolean(booking.handover?.pickupUsedAt);

  const { data: ridersData } = useAsync(
    () => http.get<{ riders: RiderAccount[] }>("/api/admin/riders"),
    [],
  );
  const riders = (ridersData?.riders ?? []).filter((r) => r.active || r.id === booking.assignedRiderId);

  const [riderId, setRiderId] = useState(booking.assignedRiderId ?? "");
  const [assigning, setAssigning] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [manualOpen, setManualOpen] = useState(false);
  const [name, setName] = useState(booking.assignedDriver?.name ?? "");
  const [phone, setPhone] = useState(booking.assignedDriver?.phone ?? "");
  const [plate, setPlate] = useState(booking.assignedDriver?.plate ?? "");
  const [savingManual, setSavingManual] = useState(false);

  const currentRider = useMemo(
    () => riders.find((r) => r.id === booking.assignedRiderId),
    [riders, booking.assignedRiderId],
  );

  const d = booking.assignedDriver;

  if (terminal) {
    if (!d || (!d.name && !d.phone && !d.plate)) return null;
    return (
      <Card>
        <CardHeader title="Assigned rider" />
        <CardBody className="grid grid-cols-3 gap-3 text-sm">
          <Field label="Name" value={d.name} />
          <Field label="Phone" value={d.phone} />
          <Field label="Plate" value={d.plate} mono />
        </CardBody>
      </Card>
    );
  }

  async function assign() {
    if (!riderId) return;
    setAssigning(true);
    setError(null);
    try {
      await http.patch(`/api/admin/bookings/${booking.bookingReference}/assign-rider`, { riderId });
      toast.success("Rider assigned", "They've been notified and can see this job on their dashboard.");
      onChanged?.();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not assign the rider.");
    } finally {
      setAssigning(false);
    }
  }

  async function autoAssign() {
    setAutoAssigning(true);
    setError(null);
    try {
      await http.post(`/api/admin/bookings/${booking.bookingReference}/auto-assign`);
      toast.success(
        booking.assignedRiderId ? "Rider swapped" : "Rider assigned",
        "Picked automatically. Everyone has been notified.",
      );
      onChanged?.();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not auto-assign a rider.");
    } finally {
      setAutoAssigning(false);
    }
  }

  async function saveManual() {
    setSavingManual(true);
    setError(null);
    try {
      await http.patch(`/api/admin/bookings/${booking.bookingReference}/rider`, {
        name: name.trim(),
        phone: phone.trim(),
        plate: plate.trim(),
      });
      toast.success("Rider details saved");
      onChanged?.();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not save the rider details.");
    } finally {
      setSavingManual(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Assigned rider"
        description={
          canAssign
            ? "Riders are assigned automatically once a booking is paid. You can re-run the allocator or override it below."
            : "A rider is assigned automatically once the booking is paid and confirmed."
        }
      />
      <CardBody className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        {booking.assignedRiderId ? (
          <div className="rounded-xl bg-surface p-3 text-sm">
            <p className="font-bold">{currentRider?.fullName ?? d?.name ?? "Rider assigned"}</p>
            <p className="text-muted">
              {d?.phone ?? currentRider?.phone} {d?.plate ? `· ${d.plate}` : ""}
            </p>
          </div>
        ) : null}

        {booking.status === "confirmed" && !booking.assignedRiderId && !d?.name ? (
          <Alert tone="warning">
            Waiting for a free rider. It will be assigned automatically as soon as one becomes available (a
            rider finishes a delivery, or one is added), or use Auto-assign now.
          </Alert>
        ) : null}

        {canAssign ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                label="Rider"
                value={riderId}
                onChange={(e) => setRiderId(e.target.value)}
                containerClassName="flex-1"
              >
                <option value="">Choose a rider to assign by hand…</option>
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.fullName}
                    {r.plate ? ` · ${r.plate}` : ""}
                    {` (${r.activeJobs}/${r.maxActiveJobs} active${r.activeJobs >= r.maxActiveJobs ? ", full" : ""})`}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                loading={assigning}
                disabled={!riderId || riderId === booking.assignedRiderId}
                onClick={assign}
              >
                {booking.assignedRiderId ? "Reassign to selected" : "Assign selected"}
              </Button>
              {!pickedUp ? (
                <Button variant="secondary" size="sm" loading={autoAssigning} onClick={autoAssign}>
                  {booking.assignedRiderId ? "Auto-pick a different rider" : "Auto-assign now"}
                </Button>
              ) : null}
            </div>
            {riders.length === 0 ? (
              <p className="text-xs text-muted">
                No riders yet — add one from the{" "}
                <a href="/admin/riders" className="font-semibold underline">
                  Riders
                </a>{" "}
                page.
              </p>
            ) : null}
          </>
        ) : null}

        {!booking.assignedRiderId && canAssign ? (
          <div className="border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setManualOpen((v) => !v)}
              className="text-xs font-semibold text-muted hover:text-ink"
            >
              {manualOpen ? "Hide manual entry" : "No rider account? Enter details manually"}
            </button>
            {manualOpen ? (
              <div className="mt-3 space-y-3">
                <Input label="Rider name" value={name} onChange={(e) => setName(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <Input
                    label="Plate number"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="e.g. LAG-123-XY"
                  />
                </div>
                <p className="text-xs text-muted">
                  Without a rider account, no one can confirm pickup/delivery with handover codes — you&apos;ll
                  need to update the status manually.
                </p>
                <Button size="sm" fullWidth loading={savingManual} onClick={saveManual}>
                  Save rider details
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className={"mt-0.5 font-semibold" + (mono ? " font-mono tracking-wide" : "")}>
        {value || "—"}
      </p>
    </div>
  );
}
