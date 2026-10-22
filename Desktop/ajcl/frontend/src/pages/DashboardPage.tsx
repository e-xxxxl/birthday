import { AppLink as Link } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingBlock, Alert } from "@/components/ui/Feedback";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { DashboardBookings } from "@/components/dashboard/DashboardBookings";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import { formatNaira } from "@/lib/utils";
import type { BookingDTO, PartnerLedgerDTO } from "@/types";

function bucketBookings(bookings: BookingDTO[]) {
  return {
    active: bookings.filter((b) => ["confirmed", "driver_assigned", "in_transit"].includes(b.status)),
    pending: bookings.filter((b) => b.status === "pending"),
    completed: bookings.filter((b) => b.status === "delivered"),
    cancelled: bookings.filter((b) => b.status === "cancelled"),
    returned: bookings.filter((b) => b.status === "returned"),
  };
}

export function DashboardPage() {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(
    () => http.get<{ bookings: BookingDTO[] }>("/api/bookings"),
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
  const buckets = bucketBookings(bookings);
  const totalSpent = bookings
    .filter((b) => b.payment.status === "paid")
    .reduce((sum, b) => sum + b.pricing.total, 0);

  const stats = isPartner
    ? [
        { label: "Active deliveries", value: buckets.active.length },
        { label: "Completed", value: buckets.completed.length },
        { label: "Returned", value: buckets.returned.length },
        { label: "Amount owed", value: formatNaira(owed) },
      ]
    : [
        { label: "Active deliveries", value: buckets.active.length },
        { label: "Awaiting payment", value: buckets.pending.length },
        { label: "Completed", value: buckets.completed.length },
        { label: "Total spent", value: formatNaira(totalSpent) },
      ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Welcome back, {user?.firstName}</h1>
          <p className="mt-1 text-sm text-muted">Here&apos;s what&apos;s happening with your deliveries.</p>
        </div>
        <Button href="/book">New booking</Button>
      </div>

      {isPartner ? (
        <Alert tone="info" title={user?.partner?.company ? `Partner account · ${user.partner.company}` : "Partner account"}>
          Your orders are billed to your account, so there&apos;s nothing to pay when you book.{" "}
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
          <div
            key={s.label}
            className="min-w-0 rounded-2xl border border-line bg-paper shadow-card p-4 sm:p-5"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">
              {s.label}
            </p>
            <p className="mt-1.5 text-xl font-bold leading-tight font-mono tabular-nums [overflow-wrap:anywhere] sm:mt-2 sm:text-2xl">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {loading && bookings.length === 0 ? (
        <LoadingBlock label="Loading your bookings…" />
      ) : (
        <>
          {buckets.pending.length > 0 ? (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
                {isPartner ? "Not placed yet" : "Awaiting payment"}
              </h2>
              <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {buckets.pending.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            </section>
          ) : null}

          {bookings.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              description="Book your first delivery and it will show up here with live status tracking."
              action={<Button href="/book">Book a delivery</Button>}
            />
          ) : (
            <DashboardBookings buckets={buckets} />
          )}
        </>
      )}

      <p className="text-center text-xs text-muted">
        Need help with a delivery?{" "}
        <Link href="/contact" className="font-semibold text-ink hover:underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}
