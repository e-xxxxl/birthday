import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingBlock, EmptyState, Alert } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { HandoverFlow } from "@/components/rider/HandoverFlow";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import { DELIVERY_TYPES } from "@/config/booking";
import { formatDate } from "@/lib/utils";
import type { RiderJobDTO } from "@/types";
import { AddressLines, AddressActions } from "@/components/common/AddressBlock";

export function RiderJobDetailPage() {
  const { reference = "" } = useParams();
  useDocumentTitle(`Job ${reference}`);
  const toast = useToast();

  const { data, loading, error, reload } = useAsync(
    () => http.get<{ job: RiderJobDTO }>(`/api/rider/jobs/${encodeURIComponent(reference)}`),
    [reference],
  );

  const [stage, setStage] = useState<"pickup" | "deliver" | null>(null);

  if (loading && !data) return <LoadingBlock label="Loading job…" />;
  if (error || !data) {
    return (
      <EmptyState
        title="Job not found"
        description={error ?? "This job isn't assigned to you, or doesn't exist."}
        action={
          <Link href="/rider" className="font-semibold text-ink hover:underline">
            ← My deliveries
          </Link>
        }
      />
    );
  }

  const booking = data.job;
  const canConfirmPickup = booking.status === "driver_assigned";
  const canConfirmDelivery = booking.status === "in_transit";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/rider" className="text-sm font-semibold text-muted hover:text-ink">
          ← My deliveries
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-mono text-2xl font-bold">{booking.bookingReference}</h1>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {formatDate(booking.scheduledDate)} · {booking.scheduledTime} ·{" "}
          {DELIVERY_TYPES[booking.deliveryType].label} · {booking.vehicle.name}
        </p>
      </div>

      {canConfirmPickup || canConfirmDelivery ? (
        <Card className="border-ink">
          <CardBody className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">
                {canConfirmPickup ? "Ready to collect the package?" : "Arrived at the receiver?"}
              </p>
              <p className="text-sm text-muted">
                {canConfirmPickup
                  ? "Ask the sender for their pickup code, or scan their QR."
                  : "Ask the receiver for their delivery code, or scan their QR."}
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => {
                setStage(canConfirmPickup ? "pickup" : "deliver");
              }}
            >
              {canConfirmPickup ? "Confirm pickup" : "Confirm delivery"}
            </Button>
          </CardBody>
        </Card>
      ) : booking.status === "delivered" ? (
        <Alert tone="success">This delivery is complete. Nice work!</Alert>
      ) : null}

      <Card>
        <CardHeader title="Pickup" />
        <CardBody className="space-y-3">
          <AddressLines loc={booking.pickup} />
          <AddressActions loc={booking.pickup} />
        </CardBody>
      </Card>

      {booking.stops.map((stop, i) => (
        <Card key={i}>
          <CardHeader title={`Stop ${i + 1}`} />
          <CardBody className="space-y-3">
            <AddressLines loc={stop} />
            <AddressActions loc={stop} />
          </CardBody>
        </Card>
      ))}

      <Card>
        <CardHeader title="Drop-off" />
        <CardBody className="space-y-3">
          <AddressLines loc={booking.destination} />
          <AddressActions loc={booking.destination} />
        </CardBody>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader title="Sender" />
          <CardBody className="space-y-0.5 text-sm">
            <p className="font-semibold">{booking.sender.name}</p>
            <p className="text-muted">
              <a href={`tel:${booking.sender.phone}`} className="hover:underline">
                {booking.sender.phone}
              </a>
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Receiver" />
          <CardBody className="space-y-0.5 text-sm">
            <p className="font-semibold">{booking.recipient.name}</p>
            <p className="text-muted">
              <a href={`tel:${booking.recipient.phone}`} className="hover:underline">
                {booking.recipient.phone}
              </a>
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Package" />
        <CardBody className="space-y-1 text-sm">
          <p className="font-semibold">{booking.package.description}</p>
          <p className="text-muted">
            {booking.package.category} · Qty {booking.package.quantity}
          </p>
          {booking.package.specialInstructions ? (
            <p className="text-muted">Instructions: {booking.package.specialInstructions}</p>
          ) : null}
          {booking.notes ? <p className="text-muted">Notes: {booking.notes}</p> : null}
        </CardBody>
      </Card>

      <Modal
        open={stage !== null}
        onClose={() => setStage(null)}
        title={stage === "pickup" ? "Confirm pickup" : "Confirm delivery"}
        description={
          stage === "pickup"
            ? "Scan the sender's QR or enter their 6-digit code, then add a photo and your location."
            : "Scan the receiver's QR or enter their 6-digit code, then add a photo and your location."
        }
      >
        {stage ? (
          <HandoverFlow
            key={stage}
            reference={booking.bookingReference}
            stage={stage === "pickup" ? "pickup" : "delivery"}
            onDone={() => {
              toast.success(stage === "pickup" ? "Pickup confirmed" : "Delivery confirmed");
              setStage(null);
              reload();
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}
