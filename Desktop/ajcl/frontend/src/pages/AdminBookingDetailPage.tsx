import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge, PaymentBadge } from "@/components/ui/Badge";
import { LoadingBlock, EmptyState } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { RouteSummary } from "@/components/booking/RouteSummary";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { AdminStatusPanel } from "@/components/admin/AdminStatusPanel";
import { AdminRiderPanel } from "@/components/admin/AdminRiderPanel";
import { AdminHandoverPanel } from "@/components/admin/AdminHandoverPanel";
import { AdminAmountPanel } from "@/components/admin/AdminAmountPanel";
import { ProofGallery } from "@/components/booking/ProofGallery";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import { DELIVERY_TYPES, returnReasonLabel } from "@/config/booking";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { BookingDTO, ProofDTO } from "@/types";
import type { AdminAuditEntry, AdminPaymentEntry } from "@/types/admin";

type Detail = {
  booking: BookingDTO;
  audit: AdminAuditEntry[];
  payments: AdminPaymentEntry[];
  proofs: ProofDTO[];
};

export function AdminBookingDetailPage() {
  const { reference = "" } = useParams();
  useDocumentTitle(`Booking ${reference}`);
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useAsync(
    () => http.get<Detail>(`/api/admin/bookings/${encodeURIComponent(reference)}`),
    [reference],
  );

  async function deleteBooking() {
    setDeleting(true);
    try {
      await http.del(`/api/admin/bookings/${encodeURIComponent(reference)}`);
      toast.success("Booking deleted");
      navigate("/admin/bookings");
    } catch (err) {
      toast.error("Could not delete", err instanceof HttpError ? err.message : "");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading && !data) return <LoadingBlock label="Loading booking…" />;
  if (error || !data) {
    return (
      <EmptyState
        icon="🔍"
        title="Booking not found"
        description={error ?? "We couldn't find that booking."}
        action={
          <Link href="/admin/bookings" className="font-semibold text-ink hover:underline">
            ← All bookings
          </Link>
        }
      />
    );
  }

  const { booking, audit, payments, proofs } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/bookings" className="text-sm font-semibold text-muted hover:text-ink">
          ← All bookings
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-mono text-2xl font-bold">{booking.bookingReference}</h1>
          <div className="flex items-center gap-2">
            <PaymentBadge status={booking.payment.status} />
            <StatusBadge status={booking.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader title="Customer" />
              <CardBody className="space-y-0.5 text-sm">
                <p className="font-semibold">{booking.customer?.fullName}</p>
                <p className="text-muted">{booking.customer?.email}</p>
                <p className="text-muted">{booking.customer?.phone}</p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Schedule" />
              <CardBody className="space-y-0.5 text-sm">
                <p className="font-semibold">
                  {formatDate(booking.scheduledDate)} · {booking.scheduledTime}
                </p>
                <p className="text-muted">{DELIVERY_TYPES[booking.deliveryType].label}</p>
                <p className="text-muted">
                  {booking.distanceKm} km · {booking.vehicle.name}
                </p>
              </CardBody>
            </Card>
          </div>

          {booking.status === "returned" ? (
            <Card className="border-[var(--color-warning)]/40">
              <CardHeader title="Returned order" />
              <CardBody className="space-y-1 text-sm">
                <p>
                  <span className="text-muted">Reason: </span>
                  <strong>{returnReasonLabel(booking.returnReason)}</strong>
                </p>
                {booking.returnNote ? <p className="text-ink-soft">{booking.returnNote}</p> : null}
                {booking.returnedAt ? <p className="text-xs text-muted">Marked returned {formatDateTime(booking.returnedAt)}</p> : null}
              </CardBody>
            </Card>
          ) : null}

          <AdminRiderPanel
            key={`rider:${booking.updatedAt}`}
            booking={booking}
            onChanged={reload}
          />

          <AdminHandoverPanel
            key={`handover:${booking.updatedAt}`}
            booking={booking}
            onChanged={reload}
          />

          <ProofGallery
            reference={booking.bookingReference}
            proofs={proofs ?? []}
            photoBase="/api/admin/bookings"
            showLocation
          />

          <Card>
            <CardHeader title="Route" />
            <CardBody>
              <RouteSummary
                pickup={booking.pickup}
                stops={booking.stops}
                destination={booking.destination}
                deliveryType={booking.deliveryType}
              />
            </CardBody>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader title="Sender" />
              <CardBody className="space-y-0.5 text-sm">
                <p className="font-semibold">{booking.sender.name}</p>
                <p className="text-muted">{booking.sender.phone}</p>
                {booking.sender.email ? <p className="text-muted">{booking.sender.email}</p> : null}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Recipient" />
              <CardBody className="space-y-0.5 text-sm">
                <p className="font-semibold">{booking.recipient.name}</p>
                <p className="text-muted">{booking.recipient.phone}</p>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Package" />
            <CardBody className="space-y-1 text-sm">
              <p className="font-semibold">{booking.package.description}</p>
              <p className="text-muted">
                {booking.package.category} · Qty {booking.package.quantity}
                {booking.package.declaredValue > 0
                  ? ` · Declared ₦${booking.package.declaredValue.toLocaleString()}`
                  : ""}
              </p>
              {booking.package.specialInstructions ? (
                <p className="text-muted">Instructions: {booking.package.specialInstructions}</p>
              ) : null}
              {booking.notes ? <p className="text-muted">Rider notes: {booking.notes}</p> : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Payments" />
            <CardBody className="space-y-3">
              <PriceBreakdown price={booking.pricing} />
              <div className="space-y-2 border-t border-line pt-3 text-xs">
                {payments.length === 0 ? (
                  <p className="text-muted">
                    {booking.payment.status === "on_account"
                      ? "Billed to the partner's account. Payments are recorded on the partner's page."
                      : "No payment attempts recorded."}
                  </p>
                ) : (
                  payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg bg-surface px-3 py-2"
                    >
                      <div>
                        <p className="font-mono font-semibold text-ink">{p.reference}</p>
                        <p className="text-muted">
                          {p.channel ?? "—"} · verified via {p.verifiedVia}
                          {p.paidAt ? ` · ${formatDateTime(p.paidAt)}` : ""}
                        </p>
                      </div>
                      <span className="font-semibold text-ink-soft">{p.status}</span>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <AdminStatusPanel
            key={`${booking.status}:${booking.updatedAt}`}
            booking={booking}
            onChanged={reload}
          />

          <AdminAmountPanel
            key={`amount:${booking.pricing.total}:${booking.updatedAt}`}
            booking={booking}
            onChanged={reload}
          />

          <Card>
            <CardHeader title="Status history" />
            <CardBody>
              <ol className="space-y-3 text-sm">
                {audit.map((a) => (
                  <li key={a.id} className="border-l-2 border-line pl-3">
                    <p className="font-semibold">
                      {a.fromStatus ? `${a.fromStatus} → ` : ""}
                      {a.toStatus}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateTime(a.at)} · {a.actorName ?? a.actorRole}
                    </p>
                    {a.note ? <p className="mt-0.5 text-ink-soft">{a.note}</p> : null}
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          {user?.superAdmin ? (
            <Card className="border-[var(--color-danger)]/30">
              <CardHeader title="Danger zone" />
              <CardBody className="space-y-3">
                <p className="text-sm text-muted">
                  Permanently delete this booking and its payment &amp; status records. This can&apos;t
                  be undone.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete booking
                </Button>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteBooking}
        loading={deleting}
        title={`Delete ${booking.bookingReference}?`}
        confirmLabel="Delete permanently"
        message={
          <>
            Booking <strong>{booking.bookingReference}</strong>, its payment ledger and status
            history will be permanently removed. This cannot be undone.
          </>
        }
      />
    </div>
  );
}
