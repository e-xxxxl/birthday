import { AppLink as Link } from "@/components/ui/AppLink";
import { StatusBadge, PaymentBadge } from "@/components/ui/Badge";
import { formatDate, formatNaira } from "@/lib/utils";
import type { BookingDTO } from "@/types";

export function AdminBookingRow({ booking, card = false }: { booking: BookingDTO; card?: boolean }) {
  const href = `/admin/bookings/${booking.bookingReference}`;

  if (card) {
    return (
      <Link href={href} className="block p-4 hover:bg-surface">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-bold">{booking.bookingReference}</span>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-1 text-sm text-ink-soft">{booking.customer?.fullName ?? "—"}</p>
        <p className="truncate text-xs text-muted">
          {booking.pickup.formattedAddress} → {booking.destination.formattedAddress}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <PaymentBadge status={booking.payment.status} />
          <span className="text-sm font-bold tabular-nums">{formatNaira(booking.pricing.total)}</span>
        </div>
      </Link>
    );
  }

  return (
    <tr className="border-b border-line last:border-0 hover:bg-surface">
      <td className="px-4 py-3">
        <Link href={href} className="font-mono font-bold hover:underline">
          {booking.bookingReference}
        </Link>
        <p className="text-xs text-muted">{formatDate(booking.createdAt)}</p>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium">{booking.customer?.fullName ?? "—"}</p>
        <p className="text-xs text-muted">{booking.customer?.phone}</p>
      </td>
      <td className="max-w-[220px] px-4 py-3">
        <p className="truncate text-xs text-ink-soft">{booking.pickup.formattedAddress}</p>
        <p className="truncate text-xs text-muted">→ {booking.destination.formattedAddress}</p>
      </td>
      <td className="px-4 py-3 font-semibold tabular-nums">{formatNaira(booking.pricing.total)}</td>
      <td className="px-4 py-3">
        <PaymentBadge status={booking.payment.status} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={booking.status} />
      </td>
    </tr>
  );
}
