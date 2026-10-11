
import { AppLink as Link } from "@/components/ui/AppLink";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { DELIVERY_TYPES } from "@/config/booking";
import type { LocationDTO, RiderJobDTO } from "@/types";

/** One line a rider can recognise at a glance: door details first, then the street address. */
function lineFor(loc: LocationDTO): { primary: string; secondary?: string } {
  if (loc.details) return { primary: loc.details, secondary: loc.formattedAddress };
  return { primary: loc.formattedAddress };
}

/** A rider's job card — no price, no payment info, just what they need to do the job. */
export function RiderJobCard({ booking }: { booking: RiderJobDTO }) {
  return (
    <Link
      href={`/rider/jobs/${booking.bookingReference}`}
      className="block rounded-2xl border border-line bg-paper p-5 shadow-card transition hover:-translate-y-0.5 hover:border-ink"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-bold">{booking.bookingReference}</p>
          <p className="text-xs text-muted">
            {formatDate(booking.scheduledDate)} · {booking.scheduledTime} ·{" "}
            {DELIVERY_TYPES[booking.deliveryType].label}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        {[
          { loc: booking.pickup, dot: "bg-[var(--color-success)]" },
          { loc: booking.destination, dot: "bg-[var(--color-danger)]" },
        ].map(({ loc, dot }, i) => {
          const l = lineFor(loc);
          return (
            <div key={i} className="flex items-start gap-2">
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dot}`} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{l.primary}</p>
                {l.secondary ? <p className="truncate text-xs text-muted">{l.secondary}</p> : null}
              </div>
            </div>
          );
        })}
        {booking.stops.length > 0 ? (
          <p className="pl-4 text-xs text-muted">
            +{booking.stops.length} stop{booking.stops.length > 1 ? "s" : ""} on the way
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-3 text-sm">
        <span className="font-semibold">{booking.vehicle.name}</span>
        <span className="text-muted">
          {booking.status === "driver_assigned"
            ? "Awaiting pickup"
            : booking.status === "in_transit"
              ? booking.handover?.pickupUsedAt
                ? "Awaiting delivery"
                : "In transit"
              : booking.status === "delivered"
                ? "Completed"
                : booking.status}
        </span>
      </div>
    </Link>
  );
}
