import { useParams } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingBlock, EmptyState } from "@/components/ui/Feedback";
import { HandoverCodeCard } from "@/components/booking/HandoverCodeCard";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import { BOOKING_STATUS_FLOW, BOOKING_STATUS_META } from "@/config/booking";
import { formatDate } from "@/lib/utils";
import type { TrackingDTO } from "@/types";
import { cn } from "@/lib/utils";

export function TrackingPage() {
  const { token = "" } = useParams();
  useDocumentTitle("Track your delivery");

  const { data, loading, error } = useAsync(
    () => http.get<{ tracking: TrackingDTO }>(`/api/track/${encodeURIComponent(token)}`),
    [token],
  );

  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line bg-paper">
        <div className="container-page flex h-16 items-center">
          <Logo />
        </div>
      </header>

      <main className="container-page min-w-0 py-8 sm:py-10">
        {loading && !data ? (
          <LoadingBlock label="Loading your delivery…" />
        ) : error || !data ? (
          <EmptyState
            icon="📦"
            title="Tracking link not found"
            description="This link may have expired or been typed incorrectly. Ask the sender to resend it."
          />
        ) : (
          <TrackingView tracking={data.tracking} />
        )}
      </main>
    </div>
  );
}

function TrackingView({ tracking }: { tracking: TrackingDTO }) {
  const progress = tracking.status === "cancelled" ? -1 : BOOKING_STATUS_FLOW.indexOf(tracking.status);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {tracking.recipientName ? `Hi ${tracking.recipientName}, ` : ""}your delivery is on the way
          </h1>
          <p className="mt-1 font-mono text-sm text-muted">{tracking.bookingReference}</p>
        </div>
        <StatusBadge status={tracking.status} />
      </div>

      <Card>
        <CardHeader title="Status" />
        <CardBody>
          {tracking.status === "cancelled" ? (
            <p className="text-sm text-[var(--color-danger)]">This delivery was cancelled.</p>
          ) : (
            <ol className="space-y-4">
              {BOOKING_STATUS_FLOW.map((s, i) => {
                const done = i <= progress;
                const meta = BOOKING_STATUS_META[s];
                return (
                  <li key={s} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                        done ? "bg-ink text-paper" : "bg-surface-2 text-muted",
                      )}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <div>
                      <p className={cn("text-sm font-semibold", done ? "text-ink" : "text-muted")}>
                        {meta.label}
                      </p>
                      <p className="text-xs text-muted">{meta.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardBody>
      </Card>

      {tracking.rider ? (
        <Card>
          <CardHeader title="Your rider" />
          <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Name</p>
              <p className="mt-0.5 font-semibold">{tracking.rider.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Phone</p>
              <p className="mt-0.5 font-semibold">
                {tracking.rider.phone ? (
                  <a href={`tel:${tracking.rider.phone}`} className="hover:underline">
                    {tracking.rider.phone}
                  </a>
                ) : (
                  "—"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Plate</p>
              <p className="mt-0.5 font-mono font-semibold tracking-wide">{tracking.rider.plate || "—"}</p>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {tracking.status !== "cancelled" && tracking.status !== "delivered" ? (
        <HandoverCodeCard
          title="Your delivery code"
          description="Show this to the rider — QR or digits — when the package arrives, so they can confirm it reached you."
          code={tracking.deliveryCode}
          usedAt={tracking.deliveryUsedAt}
          locked={tracking.deliveryLocked}
          tone="navy"
        />
      ) : null}

      <Card>
        <CardHeader title="Route" />
        <CardBody className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--color-success)]" />
            <span className="text-ink-soft">{tracking.pickup.formattedAddress}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--color-danger)]" />
            <span className="text-ink-soft">{tracking.destination.formattedAddress}</span>
          </div>
          <p className="border-t border-line pt-3 text-xs text-muted">
            {tracking.vehicleName} · Scheduled {formatDate(tracking.scheduledDate)} · {tracking.scheduledTime}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
