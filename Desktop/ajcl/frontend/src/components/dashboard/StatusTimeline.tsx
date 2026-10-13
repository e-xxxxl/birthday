import { cn, formatDateTime } from "@/lib/utils";
import { BOOKING_STATUS_FLOW, BOOKING_STATUS_META, returnReasonLabel } from "@/config/booking";
import type { BookingDTO } from "@/types";

export function StatusTimeline({ booking }: { booking: BookingDTO }) {
  const cancelled = booking.status === "cancelled";
  const returned = booking.status === "returned";
  const currentIndex = BOOKING_STATUS_FLOW.indexOf(
    booking.status === "cancelled" || booking.status === "returned" ? "pending" : booking.status,
  );

  // Latest timestamp we saw each status change at.
  const stampFor = (status: string) =>
    [...booking.statusHistory].reverse().find((h) => h.status === status)?.at;

  if (returned) {
    const when = booking.returnedAt ?? stampFor("returned");
    return (
      <div className="rounded-xl border border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] p-4">
        <p className="text-sm font-bold text-[var(--color-warning)]">Order returned</p>
        {when ? <p className="text-xs text-[var(--color-warning)]/80">{formatDateTime(when)}</p> : null}
        <p className="mt-1 text-sm text-ink-soft">
          The package could not be delivered and was returned. Reason:{" "}
          <strong>{returnReasonLabel(booking.returnReason)}</strong>.
        </p>
        {booking.returnNote ? <p className="mt-1 text-sm text-ink-soft">{booking.returnNote}</p> : null}
      </div>
    );
  }

  if (cancelled) {
    const when = stampFor("cancelled");
    return (
      <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4">
        <p className="text-sm font-bold text-[var(--color-danger)]">Booking cancelled</p>
        {when ? <p className="text-xs text-[var(--color-danger)]/80">{formatDateTime(when)}</p> : null}
        {booking.statusHistory.find((h) => h.status === "cancelled")?.note ? (
          <p className="mt-1 text-sm text-ink-soft">
            {booking.statusHistory.find((h) => h.status === "cancelled")?.note}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <ol>
      {BOOKING_STATUS_FLOW.map((status, i) => {
        const meta = BOOKING_STATUS_META[status];
        const done = i < currentIndex;
        const active = i === currentIndex;
        const when = stampFor(status);
        return (
          <li key={status} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition",
                  done && "border-[var(--color-success)] bg-[var(--color-success)] text-paper",
                  active && "border-ink bg-ink text-paper",
                  !done && !active && "border-line-strong bg-paper text-muted",
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              {i < BOOKING_STATUS_FLOW.length - 1 ? (
                <span
                  className={cn("mt-1 w-0.5 flex-1", done ? "bg-[var(--color-success)]" : "bg-line-strong")}
                />
              ) : null}
            </div>
            <div className={cn("pb-1", !done && !active && "opacity-60")}>
              <p className="text-sm font-bold">{meta.label}</p>
              <p className="text-xs text-muted">{meta.description}</p>
              {when && (done || active) ? (
                <p className="mt-0.5 text-xs font-medium text-ink-soft">{formatDateTime(when)}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
