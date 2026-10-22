
import { useMemo } from "react";
import { useBookingWizard } from "@/components/booking/BookingWizardContext";
import { RouteSummary } from "@/components/booking/RouteSummary";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { DELIVERY_TYPES } from "@/config/booking";
import { formatDate } from "@/lib/utils";
import type { WizardStepProps } from "@/components/booking/BookingWizard";

export function ReviewStep({ goNext, goBack, goTo }: WizardStepProps) {
  const { draft, quote, selectedVehicle } = useBookingWizard();

  const priced = useMemo(
    () => quote?.vehicles.find((v) => v.vehicle.slug === draft.vehicleSlug),
    [quote, draft.vehicleSlug],
  );

  const missing =
    !draft.pickup ||
    !draft.destination ||
    !draft.scheduledDate ||
    !draft.scheduledTime ||
    !selectedVehicle ||
    !priced ||
    !draft.sender.name ||
    !draft.recipient.name ||
    !draft.package.description;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <Card>
          <CardHeader
            title="Route"
            action={
              <button
                type="button"
                onClick={() => goTo("locations")}
                className="text-xs font-semibold text-ink-soft hover:text-ink"
              >
                Edit
              </button>
            }
          />
          <CardBody>
            <RouteSummary
              pickup={draft.pickup}
              stops={draft.stops.filter((s) => s.formattedAddress)}
              destination={draft.destination}
              deliveryType={draft.deliveryType}
            />
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <div>
                <dt className="rule-label">Type</dt>
                <dd>{DELIVERY_TYPES[draft.deliveryType].label}</dd>
              </div>
              <div>
                <dt className="rule-label">When</dt>
                <dd>
                  {draft.scheduledDate ? formatDate(draft.scheduledDate) : "—"} · {draft.scheduledTime}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Vehicle"
            action={
              <button
                type="button"
                onClick={() => goTo("vehicle")}
                className="text-xs font-semibold text-ink-soft hover:text-ink"
              >
                Edit
              </button>
            }
          />
          <CardBody>
            {selectedVehicle ? (
              <div>
                <p className="font-bold">{selectedVehicle.name}</p>
                <p className="text-sm text-muted">{selectedVehicle.description}</p>
              </div>
            ) : (
              <p className="text-sm italic text-muted">No vehicle selected</p>
            )}
          </CardBody>
        </Card>

        <div className="grid gap-5 sm:grid-cols-2">
          <Card>
            <CardHeader
              title="Sender"
              action={
                <button
                  type="button"
                  onClick={() => goTo("details")}
                  className="text-xs font-semibold text-ink-soft hover:text-ink"
                >
                  Edit
                </button>
              }
            />
            <CardBody className="text-sm">
              <p className="font-semibold">{draft.sender.name || "—"}</p>
              <p className="text-muted">{draft.sender.phone}</p>
              {draft.sender.email ? <p className="text-muted">{draft.sender.email}</p> : null}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Recipient" />
            <CardBody className="text-sm">
              <p className="font-semibold">{draft.recipient.name || "—"}</p>
              <p className="text-muted">{draft.recipient.phone}</p>
              {draft.recipient.email ? <p className="text-muted">{draft.recipient.email}</p> : null}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Package" />
          <CardBody className="space-y-1 text-sm">
            <p className="font-semibold">{draft.package.description || "—"}</p>
            <p className="text-muted">
              {draft.package.category} · Qty {draft.package.quantity}
              {draft.package.declaredValue > 0
                ? ` · Declared ₦${draft.package.declaredValue.toLocaleString()}`
                : ""}
            </p>
            {draft.package.specialInstructions ? (
              <p className="text-muted">Instructions: {draft.package.specialInstructions}</p>
            ) : null}
            {draft.notes ? <p className="text-muted">Rider notes: {draft.notes}</p> : null}
          </CardBody>
        </Card>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader title="Price summary" />
          <CardBody>
            {priced ? (
              <PriceBreakdown price={priced.price} />
            ) : (
              <p className="text-sm italic text-muted">Go back and pick a vehicle to see the price.</p>
            )}
          </CardBody>
        </Card>

        {missing ? (
          <Alert tone="warning" className="mt-4">
            Some details are still missing. Use the Edit links to complete them.
          </Alert>
        ) : null}

        <div className="mt-4 flex flex-col gap-2">
          <Button size="lg" fullWidth disabled={missing} onClick={goNext}>
            Continue to payment
          </Button>
          <Button variant="secondary" fullWidth onClick={goBack}>
            Back
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted">
          The final amount is re-checked on our servers before you pay.
        </p>
      </div>
    </div>
  );
}
