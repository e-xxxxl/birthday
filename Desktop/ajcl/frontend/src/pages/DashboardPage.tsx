import { AppLink as Link } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingBlock, Alert } from "@/components/ui/Feedback";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { DashboardBookings } from "@/components/dashboard/DashboardBookings";
import { ShipmentStatusBadge } from "@/components/shipping/ShipmentBits";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import { formatDate, formatNaira, regionName } from "@/lib/utils";
import type { BookingDTO, PartnerLedgerDTO } from "@/types";
import type { Shipment } from "@/types/shipping";

function bucketBookings(bookings: BookingDTO[]) {
  return {
    active: bookings.filter((b) => ["confirmed", "driver_assigned", "in_transit"].includes(b.status)),
    pending: bookings.filter((b) => b.status === "pending"),
    completed: bookings.filter((b) => b.status === "delivered"),
    cancelled: bookings.filter((b) => b.status === "cancelled"),
    returned: bookings.filter((b) => b.status === "returned"),
  };
}

const SHIPMENT_ACTIVE = [
  "awaiting_pickup",
  "in_transit_to_office",
  "awaiting_dropoff",
  "received_at_office",
  "weight_confirmed",
  "paid",
  "booked",
  "booking_failed",
  "in_transit",
];
const needsPayment = (s: Shipment) => ["pickup_fee_pending", "quote_sent"].includes(s.status) || Boolean(s.prepay?.available);

function ShipmentRow({ s }: { s: Shipment }) {
  return (
    <Link
      href={`/dashboard/shipments/${s.reference}`}
      className="flex min-w-0 flex-col gap-2 rounded-2xl border border-line bg-paper p-4 shadow-card transition hover:border-ink sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="font-mono font-bold">{s.reference}</p>
        <p className="truncate text-sm text-muted">
          To {s.receiver.name}, {s.receiver.city}, {regionName(s.receiver.country)}
        </p>
        <p className="text-xs text-muted">
          {s.shipmentType === "international" ? "International" : "Interstate"}
          {s.createdAt ? ` · ${formatDate(s.createdAt)}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {needsPayment(s) ? <span className="text-xs font-bold text-[var(--color-warning)]">Payment due</span> : null}
        <ShipmentStatusBadge status={s.status} />
      </div>
    </Link>
  );
}

export function DashboardPage() {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => http.get<{ bookings: BookingDTO[] }>("/api/bookings"), []);
  const { data: shipData, loading: shipLoading } = useAsync(
    () => http.get<{ shipments: Shipment[] }>("/api/shipments").catch(() => ({ shipments: [] as Shipment[] })),
    [],
  );

  // Partners are billed on account: show what they owe instead of what they've spent.
  const isPartner = Boolean(user?.partner);
  const { data: statement } = useAsync(
    () => (isPartner ? http.get<{ ledger: PartnerLedgerDTO }>("/api/partner/statement") : Promise.resolve(null)),
    [isPartner],
  );
  const owed = statement?.ledger.outstanding ?? 0;

  const bookings = data?.bookings ?? [];
  const shipments = shipData?.shipments ?? [];
  const buckets = bucketBookings(bookings);

  const shipActive = shipments.filter((s) => SHIPMENT_ACTIVE.includes(s.status));
  const shipDue = shipments.filter(needsPayment);
  const shipDone = shipments.filter((s) => s.status === "delivered");

  const spent =
    bookings.filter((b) => b.payment.status === "paid").reduce((sum, b) => sum + b.pricing.total, 0) +
    shipments.reduce((sum, s) => sum + (s.shippingPayment?.paid ? s.shippingPayment.amount ?? 0 : 0), 0);

  const stats = isPartner
    ? [
        { label: "Active", value: buckets.active.length + shipActive.length },
        { label: "Completed", value: buckets.completed.length + shipDone.length },
        { label: "Returned", value: buckets.returned.length },
        { label: "Amount owed", value: formatNaira(owed) },
      ]
    : [
        { label: "Active", value: buckets.active.length + shipActive.length },
        { label: "Awaiting payment", value: buckets.pending.length + shipDue.length },
        { label: "Completed", value: buckets.completed.length + shipDone.length },
        { label: "Total spent", value: formatNaira(spent) },
      ];

  const nothingYet = !loading && !shipLoading && bookings.length === 0 && shipments.length === 0;
  const recentShipments = shipments.slice(0, 4);

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-4xl">Welcome back, {user?.firstName}</h1>
          <p className="mt-1 text-sm text-muted">Your rides and shipments at a glance.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
          <Button href="/book" variant="secondary">
            Book a ride
          </Button>
          <Button href="/send">New shipment</Button>
        </div>
      </div>

      {isPartner ? (
        <Alert tone="info" title={user?.partner?.company ? `Partner account · ${user.partner.company}` : "Partner account"}>
          Your rides are billed to your account, so there&apos;s nothing to pay when you book a ride.{" "}
          <Link href="/dashboard/account" className="font-semibold underline">
            View your account statement
          </Link>
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="danger">
          {error}{" "}
          <button type="button" onClick={reload} className="font-semibold underline">
            Retry
          </button>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 rounded-2xl border border-line bg-paper p-4 shadow-card sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">{s.label}</p>
            <p className="mt-1.5 text-xl font-bold leading-tight font-mono tabular-nums [overflow-wrap:anywhere] sm:mt-2 sm:text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      {(loading && bookings.length === 0) || (shipLoading && shipments.length === 0 && bookings.length === 0) ? (
        <LoadingBlock label="Loading your dashboard…" />
      ) : nothingYet ? (
        <EmptyState
          title="Nothing here yet"
          description="Book a ride for a same-day delivery, or send a package to another state or abroad. Everything shows up here with live status."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button href="/book">Book a ride</Button>
              <Button href="/send" variant="secondary">
                New shipment
              </Button>
            </div>
          }
        />
      ) : (
        <>
          {buckets.pending.length > 0 || shipDue.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{isPartner ? "Not placed yet" : "Needs your attention"}</h2>
              {shipDue.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {shipDue.map((s) => (
                    <ShipmentRow key={s.id} s={s} />
                  ))}
                </div>
              ) : null}
              {buckets.pending.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {buckets.pending.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {recentShipments.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Shipments</h2>
                <Link href="/dashboard/shipments" className="text-sm font-semibold text-ink-soft hover:text-ink">
                  View all
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {recentShipments.map((s) => (
                  <ShipmentRow key={s.id} s={s} />
                ))}
              </div>
            </section>
          ) : null}

          {bookings.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Rides</h2>
              <DashboardBookings buckets={buckets} />
            </section>
          ) : null}
        </>
      )}

      <p className="text-center text-xs text-muted">
        Need help?{" "}
        <Link href="/contact" className="font-semibold text-ink hover:underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}
