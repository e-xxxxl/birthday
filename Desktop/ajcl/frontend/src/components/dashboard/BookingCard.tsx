import { AppLink as Link } from "@/components/ui/AppLink";
import { StatusBadge, PaymentBadge } from "@/components/ui/Badge";
import { VehicleIcon } from "@/components/ui/VehicleIcon";
import { formatDate, formatNaira } from "@/lib/utils";
import { DELIVERY_TYPES } from "@/config/booking";
import type { BookingDTO } from "@/types";

export function BookingCard({ booking, base = "/dashboard/bookings" }: { booking: BookingDTO; base?: string }) {
  return (
    <Link
      href={`${base}/${booking.bookingReference}`}
      className="block rounded-2xl border border-line bg-paper shadow-card p-5 transition hover:-translate-y-0.5 hover:border-ink"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-bold">{booking.bookingReference}</p>
          <p className="text-xs text-muted">
            {formatDate(booking.createdAt)} · {DELIVERY_TYPES[booking.deliveryType].label}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-4 space-y-1.5 text-sm">
        <p className="flex items-center gap-2">
          <span className="size-2 shrink-0 rounded-sm bg-[var(--color-success)]" />
          <span className="truncate text-ink-soft">{booking.pickup.formattedAddress}</span>
        </p>
        {booking.stops.length > 0 ? (
          <p className="pl-4 text-xs text-muted">
            +{booking.stops.length} stop{booking.stops.length > 1 ? "s" : ""}
          </p>
        ) : null}
        <p className="flex items-center gap-2">
          <span className="size-2 shrink-0 rounded-sm bg-[var(--color-danger)]" />
          <span className="truncate text-ink-soft">{booking.destination.formattedAddress}</span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <VehicleIcon slug={booking.vehicle.slug} className="size-5 shrink-0 text-muted" />
          <span className="truncate">{booking.vehicle.name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <PaymentBadge status={booking.payment.status} />
          <span className="text-sm font-bold font-mono tabular-nums">
            {formatNaira(booking.pricing.total)}
          </span>
        </span>
      </div>
    </Link>
  );
}
