
import { useRef, useState } from "react";
import { useBookingWizard } from "@/components/booking/BookingWizardContext";
import { AddressAutocomplete } from "@/components/booking/AddressAutocomplete";
import { DeliveryScheduler } from "@/components/booking/DeliveryScheduler";
import { RouteMap } from "@/components/booking/RouteMap";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/utils";
import { DELIVERY_TYPES, MAX_STOPS } from "@/config/booking";
import type { WizardStepProps } from "@/components/booking/BookingWizard";
import type { LocationDTO } from "@/types";

export function LocationsStep({ goNext, config }: WizardStepProps) {
  const { draft, update } = useBookingWizard();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Details survive re-picking an address, so retyping the place doesn't wipe them.
  const detailsMemo = useRef<Record<string, string>>({});
  const keepDetails = (key: string, loc: LocationDTO | null): LocationDTO | null =>
    loc ? { ...loc, details: loc.details ?? detailsMemo.current[key] } : null;
  function detailsField(key: string, loc: LocationDTO | null, apply: (next: LocationDTO) => void) {
    if (!loc?.formattedAddress) return null;
    return (
      <Input
        label="House number, landmark or gate instructions"
        required
        placeholder="e.g. Block 4, Flat 2, opposite First Bank, blue gate"
        value={loc.details ?? ""}
        onChange={(e) => {
          detailsMemo.current[key] = e.target.value;
          apply({ ...loc, details: e.target.value });
        }}
        error={errors[`${key}-details`]}
        hint="The rider sees this with the address, so they can find the exact door."
      />
    );
  }

  function setStop(index: number, loc: LocationDTO | null) {
    const stops = [...draft.stops];
    if (loc) stops[index] = loc;
    else stops[index] = { formattedAddress: "" };
    update({ stops });
  }

  function addStop() {
    if (draft.stops.length >= MAX_STOPS) return;
    update({ stops: [...draft.stops, { formattedAddress: "" }] });
  }

  function removeStop(index: number) {
    update({ stops: draft.stops.filter((_, i) => i !== index) });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!draft.pickup?.formattedAddress) next.pickup = "Enter a pickup address";
    if (!draft.destination?.formattedAddress) next.destination = "Enter a destination address";
    const needsDetails = (l: LocationDTO | null | undefined) => (l?.details ?? "").trim().length < 3;
    if (draft.pickup?.formattedAddress && needsDetails(draft.pickup)) {
      next["pickup-details"] = "Add the house number or a landmark";
    }
    if (draft.destination?.formattedAddress && needsDetails(draft.destination)) {
      next["destination-details"] = "Add the house number or a landmark";
    }
    draft.stops.forEach((s, i) => {
      if (!s.formattedAddress) next[`stop-${i}`] = "Enter this stop or remove it";
      else if (needsDetails(s)) next[`stop-${i}-details`] = "Add the house number or a landmark";
    });
    if (!draft.scheduledDate) next.date = "Choose a date";
    if (!draft.scheduledTime) next.time = "Choose a time";
    if (draft.scheduledDate && draft.scheduledTime) {
      const when = new Date(`${draft.scheduledDate}T${draft.scheduledTime}`);
      if (when.getTime() < Date.now()) next.time = "Pick a time in the future";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
              Delivery information
            </h2>

            <AddressAutocomplete
              label="Pickup address"
              tone="pickup"
              required
              browserKey={config.mapBrowserKey}
              value={draft.pickup}
              onChange={(loc) => update({ pickup: keepDetails("pickup", loc) })}
              error={errors.pickup}
              placeholder="Where should the rider collect from?"
            />
            {detailsField("pickup", draft.pickup, (next) => update({ pickup: next }))}

            {draft.stops.map((stop, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <AddressAutocomplete
                    label={`Stop ${i + 1}`}
                    tone="stop"
                    required
                    browserKey={config.mapBrowserKey}
                    value={stop.formattedAddress ? stop : null}
                    onChange={(loc) => setStop(i, keepDetails(`stop-${i}`, loc))}
                    error={errors[`stop-${i}`]}
                  />
                  <div className="mt-3 empty:hidden">
                    {detailsField(`stop-${i}`, stop.formattedAddress ? stop : null, (next) => setStop(i, next))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeStop(i)}
                  aria-label={`Remove stop ${i + 1}`}
                  className="mb-0.5 grid size-11 shrink-0 place-items-center rounded-sm border border-line-strong text-lg text-muted transition hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
                >
                  −
                </button>
              </div>
            ))}

            {draft.stops.length < MAX_STOPS ? (
              <button
                type="button"
                onClick={addStop}
                className="flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink"
              >
                <span className="grid size-6 place-items-center rounded-sm border border-line-strong text-base">
                  +
                </span>
                Add {draft.stops.length === 0 ? "a stop" : "another stop"}
              </button>
            ) : (
              <p className="text-xs text-muted">Maximum of {MAX_STOPS} stops.</p>
            )}

            <AddressAutocomplete
              label="Destination address"
              tone="destination"
              required
              browserKey={config.mapBrowserKey}
              value={draft.destination}
              onChange={(loc) => update({ destination: keepDetails("destination", loc) })}
              error={errors.destination}
              placeholder="Where is it going?"
            />
            {detailsField("destination", draft.destination, (next) => update({ destination: next }))}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Options</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {Object.values(DELIVERY_TYPES).map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => update({ deliveryType: t.value })}
                  className={cn(
                    "rounded-sm border p-4 text-left transition",
                    draft.deliveryType === t.value
                      ? "border-ink bg-ink/[0.03] ring-1 ring-ink"
                      : "border-line-strong hover:border-ink",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <span
                      className={cn(
                        "grid size-4 place-items-center rounded-sm border",
                        draft.deliveryType === t.value ? "border-ink bg-ink text-paper" : "border-line-strong",
                      )}
                    >
                      {draft.deliveryType === t.value ? (
                        <span className="size-1.5 rounded-sm bg-paper" />
                      ) : null}
                    </span>
                    {t.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted">{t.description}</span>
                </button>
              ))}
            </div>

            <DeliveryScheduler
              date={draft.scheduledDate}
              time={draft.scheduledTime}
              onChange={update}
              errors={{ date: errors.date, time: errors.time }}
            />
          </CardBody>
        </Card>

        {Object.keys(errors).length > 0 ? (
          <Alert tone="danger">Please fix the highlighted fields before continuing.</Alert>
        ) : null}

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={() => {
              if (validate()) goNext();
            }}
          >
            Continue to vehicle
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <RouteMap
          browserKey={config.mapBrowserKey}
          pickup={draft.pickup}
          stops={draft.stops}
          destination={draft.destination}
        />
        <p className="mt-3 text-center text-xs text-muted">
          Distance, route and price are calculated on the next step.
        </p>
      </div>
    </div>
  );
}
