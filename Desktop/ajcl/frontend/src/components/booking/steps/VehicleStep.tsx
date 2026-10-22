
import { useCallback, useEffect, useRef, useState } from "react";
import { useBookingWizard } from "@/components/booking/BookingWizardContext";
import { RouteMap } from "@/components/booking/RouteMap";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert, Skeleton } from "@/components/ui/Feedback";
import { http, HttpError } from "@/lib/http";
import { computeClientRoute } from "@/lib/maps/client";
import { vehicleImage } from "@/lib/vehicle-media";
import { cn, formatDuration, formatKm, formatNaira } from "@/lib/utils";
import type { WizardStepProps } from "@/components/booking/BookingWizard";
import type { LocationDTO, QuoteDTO } from "@/types";

function coordPoints(locs: (LocationDTO | null)[]): { lat: number; lng: number }[] {
  return locs
    .filter((l): l is LocationDTO => Boolean(l && l.lat != null && l.lng != null))
    .map((l) => ({ lat: l.lat as number, lng: l.lng as number }));
}

function routeKey(draft: ReturnType<typeof useBookingWizard>["draft"]): string {
  const loc = (l: { placeId?: string; lat?: number; lng?: number; formattedAddress: string } | null) => {
    if (!l) return "∅";
    if (l.placeId) return l.placeId;
    if (l.lat != null && l.lng != null) return `${l.lat},${l.lng}`;
    return l.formattedAddress;
  };
  return [
    loc(draft.pickup),
    ...draft.stops.map(loc),
    loc(draft.destination),
    draft.deliveryType,
  ].join(">");
}

export function VehicleStep({ goNext, goBack, config }: WizardStepProps) {
  const { draft, update, quote, setQuote, setClientRoute } = useBookingWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKey = useRef<string | null>(null);

  const key = routeKey(draft);

  const loadQuote = useCallback(async () => {
    if (!draft.pickup || !draft.destination) {
      setError("Add a pickup and destination first.");
      return;
    }
    const payload = {
      pickup: draft.pickup,
      stops: draft.stops.filter((s) => s.formattedAddress),
      destination: draft.destination,
      deliveryType: draft.deliveryType,
    };

    setLoading(true);
    setError(null);

    let baseDistanceKm = 0;
    try {
      // 1) Fast path: the server routes the coordinates itself — vehicles +
      //    prices show in a few hundred ms.
      const data = await http.post<QuoteDTO>("/api/bookings/quote", payload);
      setQuote(data);
      lastKey.current = key;
      setLoading(false);
      baseDistanceKm = data.distanceKm;

      if (
        draft.vehicleSlug &&
        !data.vehicles.some((v) => v.vehicle.slug === draft.vehicleSlug && !v.soldOut)
      ) {
        update({ vehicleSlug: null });
      }
    } catch (err) {
      setQuote(null);
      setError(err instanceof HttpError ? err.message : "Could not calculate a route. Try again.");
      setLoading(false);
      return;
    }

    // 2) Background refine (best-effort): measure the real driving route in the
    //    browser; if it shifts the distance more than ~4%, re-quote quietly.
    //    Capped at 8s — some Google SDK calls never settle when an API isn't
    //    enabled. Anything that fails here leaves the shown prices untouched.
    try {
      const points = coordPoints([draft.pickup, ...draft.stops, draft.destination]);
      if (points.length < 2 || key !== lastKey.current) return;
      const clientRoute = await Promise.race([
        computeClientRoute(
          points,
          { returnToOrigin: draft.deliveryType === "return" },
          config.mapBrowserKey,
        ).catch(() => null),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 8_000)),
      ]);
      if (!clientRoute || key !== lastKey.current) return;
      setClientRoute(clientRoute);

      const drift =
        baseDistanceKm > 0 ? Math.abs(clientRoute.distanceKm - baseDistanceKm) / baseDistanceKm : 1;
      if (drift > 0.04) {
        const refined = await http.post<QuoteDTO>("/api/bookings/quote", { ...payload, clientRoute });
        if (key === lastKey.current) setQuote(refined);
      }
    } catch {
      /* keep the prices we already have */
    }
  }, [draft, key, config.mapBrowserKey, setQuote, setClientRoute, update]);

  // Auto-calculate when arriving or when the route changed.
  useEffect(() => {
    if (lastKey.current !== key || !quote) void loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const selected = quote?.vehicles.find((v) => v.vehicle.slug === draft.vehicleSlug);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Select a vehicle</h2>
              <span className="text-xs font-semibold text-muted">Price shown is the full fare</span>
            </div>

            {error ? (
              <Alert tone="danger" className="mt-4">
                {error}{" "}
                <button type="button" onClick={loadQuote} className="font-semibold underline">
                  Retry
                </button>
              </Alert>
            ) : null}

            <div className="mt-4 space-y-3">
              {loading && !quote
                ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-sm" />)
                : quote?.vehicles.map(({ vehicle, price, unitsAvailable, soldOut }) => {
                    const active = draft.vehicleSlug === vehicle.slug;
                    const lowStock =
                      !soldOut && unitsAvailable !== null && unitsAvailable > 0 && unitsAvailable <= 2;
                    return (
                      <button
                        key={vehicle.slug}
                        type="button"
                        disabled={soldOut}
                        onClick={() => !soldOut && update({ vehicleSlug: vehicle.slug })}
                        className={cn(
                          "flex w-full gap-4 rounded-sm border p-4 text-left transition",
                          soldOut
                            ? "cursor-not-allowed border-line bg-surface/60 opacity-60"
                            : active
                              ? "border-ink bg-ink/[0.03] ring-1 ring-ink"
                              : "border-line-strong hover:border-ink",
                        )}
                      >
                        <div
                          className={cn(
                            "shrink-0 overflow-hidden rounded-sm border",
                            active ? "border-ink bg-surface" : "border-line bg-surface",
                          )}
                        >
                          <img
                            src={vehicleImage(vehicle.slug)}
                            alt={vehicle.name}
                            loading="lazy"
                            className={cn("size-20 object-contain p-1.5", soldOut && "grayscale")}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="flex items-center gap-2 font-bold">
                              {vehicle.name}
                              {soldOut ? (
                                <span className="rounded-sm bg-[var(--color-danger-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-danger)]">
                                  Fully booked
                                </span>
                              ) : lowStock ? (
                                <span className="rounded-sm bg-[var(--color-warning-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-warning)]">
                                  {unitsAvailable} left
                                </span>
                              ) : null}
                            </p>
                            <p className="text-lg font-bold font-mono tabular-nums">
                              {formatNaira(price.total)}
                            </p>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                            {vehicle.description}
                          </p>
                          <p className="mt-1.5 text-xs font-medium text-ink-soft">
                            {soldOut
                              ? "Every unit is out on a delivery — check back soon."
                              : `Approx. ${formatDuration(price.estimatedDurationSeconds)} on the road`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
            </div>

            {quote && quote.vehicles.length > 0 && quote.vehicles.every((v) => v.soldOut) ? (
              <Alert tone="warning" className="mt-4">
                Every vehicle is fully booked right now. Please check back in a little while, or
                contact support on WhatsApp for urgent deliveries.
              </Alert>
            ) : quote && quote.vehicles.every((v) => v.price.total === 0) ? (
              <Alert tone="warning" className="mt-4">
                Fares aren&apos;t available right now. Please try again shortly or contact support.
              </Alert>
            ) : null}
          </CardBody>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={goBack}>
            Back
          </Button>
          <Button
            size="lg"
            disabled={!selected || selected.soldOut}
            onClick={goNext}
          >
            Continue
          </Button>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <RouteMap
          browserKey={config.mapBrowserKey}
          pickup={draft.pickup}
          stops={draft.stops}
          destination={draft.destination}
          polyline={quote?.polyline}
        />
        {quote ? (
          <Card>
            <CardBody className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="rule-label">Distance</p>
                <p className="mt-1 text-lg font-bold">{formatKm(quote.distanceKm)}</p>
              </div>
              <div>
                <p className="rule-label">Est. time</p>
                <p className="mt-1 text-lg font-bold">
                  {formatDuration(
                    selected?.price.estimatedDurationSeconds ?? quote.estimatedDurationSeconds,
                  )}
                </p>
              </div>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
