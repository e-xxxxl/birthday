import { useState } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { AddressLines, AddressActions } from "@/components/common/AddressBlock";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import { cn, formatDate } from "@/lib/utils";
import type { RiderRouteDTO, RouteStopDTO } from "@/types";

type Coords = { lat: number; lng: number } | null;

const KIND: Record<RouteStopDTO["kind"], { label: string; dot: string }> = {
  pickup: { label: "Pickup", dot: "bg-[var(--color-success)]" },
  stop: { label: "Stop", dot: "bg-accent" },
  dropoff: { label: "Drop-off", dot: "bg-[var(--color-danger)]" },
  return: { label: "Return", dot: "bg-navy" },
};

export function RiderRoutePage() {
  useDocumentTitle("My route");
  const toast = useToast();
  const [coords, setCoords] = useState<Coords>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsync(
    () =>
      http.get<RiderRouteDTO>(
        coords ? `/api/rider/route?lat=${coords.lat}&lng=${coords.lng}` : "/api/rider/route",
      ),
    [coords?.lat, coords?.lng],
  );

  function shareLocation() {
    setLocError(null);
    if (!("geolocation" in navigator)) {
      setLocError("This device can't share its location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError("Location access was denied. Allow it in your browser settings to see orders near you.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  async function accept(reference: string) {
    setAccepting(reference);
    try {
      await http.post(`/api/rider/jobs/${reference}/accept`);
      toast.success("Order accepted", `${reference} is now on your route.`);
      reload();
    } catch (err) {
      toast.error("Couldn't accept", err instanceof HttpError ? err.message : "");
      reload();
    } finally {
      setAccepting(null);
    }
  }

  if (loading && !data) return <LoadingBlock label="Planning your route…" />;
  if (error || !data) {
    return (
      <Alert tone="danger">
        {error ?? "Could not load your route."}{" "}
        <button type="button" onClick={reload} className="font-semibold underline">
          Retry
        </button>
      </Alert>
    );
  }

  const { route, nearby } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My route</h1>
          <p className="mt-1 text-sm text-muted">Your stops in the most efficient order.</p>
        </div>
        <div className="rounded-full border border-line-strong px-3 py-1.5 text-sm font-semibold">
          {data.activeCount} of {data.maxActive} active order{data.maxActive === 1 ? "" : "s"}
        </div>
      </div>

      <Card>
        <CardHeader
          title="Your stops, in order"
          description={
            route.stops.length > 0
              ? `About ${route.totalKm} km in total${data.usedLocation ? " from where you are" : ""}. Distances are estimates.`
              : undefined
          }
          action={
            route.mapsUrl ? (
              <Button size="sm" href={route.mapsUrl} target="_blank" rel="noreferrer">
                Start navigation
              </Button>
            ) : undefined
          }
        />
        <CardBody>
          {route.stops.length === 0 ? (
            <p className="text-sm text-muted">
              You have no active deliveries. Orders assigned to you appear here, planned into one route.
            </p>
          ) : (
            <ol className="space-y-5">
              {route.stops.map((stop, i) => {
                const k = KIND[stop.kind];
                return (
                  <li key={`${stop.jobRef}-${stop.kind}-${i}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-paper">
                        {i + 1}
                      </span>
                      {i < route.stops.length - 1 ? <span className="mt-1 w-px flex-1 bg-line-strong" /> : null}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2 pb-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wide text-muted">
                          <span className={cn("size-2 rounded-full", k.dot)} />
                          {stop.kind === "stop" ? stop.label : k.label}
                        </span>
                        <Link
                          href={`/rider/jobs/${stop.jobRef}`}
                          className="font-mono font-semibold text-ink-soft hover:text-ink hover:underline"
                        >
                          {stop.jobRef}
                        </Link>
                        {stop.legKm !== null && stop.legKm > 0 ? (
                          <span className="text-muted">+{stop.legKm} km</span>
                        ) : null}
                      </div>
                      <AddressLines loc={stop.location} />
                      <AddressActions loc={stop.location} />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Orders on your route"
          description={
            data.usedLocation && route.stops.length === 0
              ? `Open orders within ${data.maxDetourKm} km of you.`
              : `Open orders that add no more than ${data.maxDetourKm} km to your route.`
          }
          action={
            <Button variant="secondary" size="sm" loading={locating} onClick={shareLocation}>
              {data.usedLocation ? "Update my location" : "Use my location"}
            </Button>
          }
        />
        <CardBody className="space-y-4">
          {locError ? <Alert tone="warning">{locError}</Alert> : null}
          {!data.canAccept ? (
            <Alert tone="info">
              You&apos;re at your limit of {data.maxActive} active order{data.maxActive === 1 ? "" : "s"}.
              Finish one to accept another.
            </Alert>
          ) : null}

          {data.needsLocation ? (
            <EmptyState
              icon="📍"
              title="Share your location"
              description="With no active deliveries yet, we need to know where you are to find orders near you."
            />
          ) : nearby.length === 0 ? (
            <EmptyState
              icon="🛵"
              title="Nothing open on your route right now"
              description="New orders that fit will appear here as customers book."
            />
          ) : (
            <ul className="space-y-3">
              {nearby.map(({ job, extraKm, mode }) => (
                <li key={job.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold">{job.bookingReference}</p>
                      <p className="text-xs text-muted">
                        {formatDate(job.scheduledDate)} · {job.scheduledTime} · {job.vehicle.name}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--color-success-soft)] px-2.5 py-1 text-xs font-bold text-[var(--color-success)]">
                      {mode === "near_you" ? `${extraKm} km from you` : `+${extraKm} km to your route`}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Pickup</p>
                      <AddressLines loc={job.pickup} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Drop-off</p>
                      <AddressLines loc={job.destination} />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="mt-4"
                    disabled={!data.canAccept}
                    loading={accepting === job.bookingReference}
                    onClick={() => accept(job.bookingReference)}
                  >
                    Accept order
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
