import { useParams } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge, PaymentBadge } from "@/components/ui/Badge";
import { LoadingBlock, EmptyState } from "@/components/ui/Feedback";
import { RouteSummary } from "@/components/booking/RouteSummary";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { HandoverCodeCard } from "@/components/booking/HandoverCodeCard";
import { ProofGallery } from "@/components/booking/ProofGallery";
import { ShareTrackingLink } from "@/components/booking/ShareTrackingLink";
import { StatusTimeline } from "@/components/dashboard/StatusTimeline";
import { BookingActions } from "@/components/dashboard/BookingActions";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import { DELIVERY_TYPES } from "@/config/booking";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { BookingDTO, ProofDTO } from "@/types";

export function BookingDetailPage() {
  const { reference = "" } = useParams();
  useDocumentTitle(`Booking ${reference}`);

  const { data, loading, error } = useAsync(
    () => http.get<{ booking: BookingDTO; proofs: ProofDTO[] }>(`/api/bookings/${encodeURIComponent(reference)}`),
    [reference],
  );

  if (loading && !data) return <LoadingBlock label="Loading booking…" />;
  if (error || !data) {
    return (
      <EmptyState
        icon="🔍"
        title="Booking not found"
        description={error ?? "We couldn't find that booking."}
        action={
          <Link href="/dashboard/bookings" className="font-semibold text-ink hover:underline">
            ← All bookings
          </Link>
        }
      />
    );
  }

  const booking = data.booking;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/dashboard/bookings" className="text-sm font-semibold text-muted hover:text-ink">
          ← All bookings
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mono text-2xl font-bold">{booking.bookingReference}</h1>
            <p className="text-sm text-muted">Created {formatDateTime(booking.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <PaymentBadge status={booking.payment.status} />
            <StatusBadge status={booking.status} />
          </div>
        </div>
      </div>

      <BookingActions booking={booking} />

      {booking.payment.status === "paid" && booking.status !== "cancelled" ? (
        <HandoverCodeCard
          title="Pickup code"
          description="Only you (the sender) can see this. Show it to the rider — QR or digits — when they arrive to collect the package."
          code={booking.pickupCode}
          usedAt={booking.handover?.pickupUsedAt}
          locked={booking.handover?.pickupLocked}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Delivery tracking"
              action={
                booking.trackingUrl && booking.status !== "cancelled" ? (
                  <ShareTrackingLink trackingUrl={booking.trackingUrl} />
                ) : undefined
              }
            />
            <CardBody>
              <StatusTimeline booking={booking} />
              {booking.assignedDriver &&
              (booking.assignedDriver.name ||
                booking.assignedDriver.phone ||
                booking.assignedDriver.plate) ? (
                <div className="mt-4 rounded-xl bg-surface p-4 text-sm">
                  <p className="font-bold">Your rider</p>
                  {booking.assignedDriver.name ? (
                    <p className="mt-0.5 text-ink-soft">{booking.assignedDriver.name}</p>
                  ) : null}
                  <dl className="mt-1 space-y-0.5 text-ink-soft">
                    {booking.assignedDriver.phone ? (
                      <div className="flex gap-2">
                        <dt className="text-muted">Phone</dt>
                        <dd className="font-semibold">
                          <a href={`tel:${booking.assignedDriver.phone}`} className="hover:text-ink">
                            {booking.assignedDriver.phone}
                          </a>
                        </dd>
                      </div>
                    ) : null}
                    {booking.assignedDriver.plate ? (
                      <div className="flex gap-2">
                        <dt className="text-muted">Plate</dt>
                        <dd className="font-mono font-semibold tracking-wide">
                          {booking.assignedDriver.plate}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <ProofGallery
            reference={booking.bookingReference}
            proofs={data.proofs ?? []}
            photoBase="/api/bookings"
            showLocation={false}
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
              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
                <Info label="Type" value={DELIVERY_TYPES[booking.deliveryType].label} />
                <Info
                  label="Scheduled"
                  value={`${formatDate(booking.scheduledDate)} · ${booking.scheduledTime}`}
                />
                <Info label="Distance" value={`${booking.distanceKm} km`} />
                <Info label="Vehicle" value={booking.vehicle.name} />
              </dl>
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
              {booking.notes ? <p className="text-muted">Notes: {booking.notes}</p> : null}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader title="Payment" />
            <CardBody>
              <PriceBreakdown price={booking.pricing} />
              <dl className="mt-4 space-y-1 border-t border-line pt-3 text-xs text-muted">
                <div className="flex justify-between">
                  <dt>Status</dt>
                  <dd className="font-semibold text-ink-soft">{booking.payment.status}</dd>
                </div>
                {booking.payment.reference ? (
                  <div className="flex justify-between">
                    <dt>Reference</dt>
                    <dd className="font-mono">{booking.payment.reference}</dd>
                  </div>
                ) : null}
                {booking.payment.paidAt ? (
                  <div className="flex justify-between">
                    <dt>Paid</dt>
                    <dd>{formatDateTime(booking.payment.paidAt)}</dd>
                  </div>
                ) : null}
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
