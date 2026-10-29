import { useState } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { EmptyState, LoadingBlock, Alert } from "@/components/ui/Feedback";
import { AdminBookingRow } from "@/components/admin/AdminBookingRow";
import { ShippingAttention } from "@/components/admin/ShippingSummary";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import { formatNaira } from "@/lib/utils";
import type { BookingDTO } from "@/types";
import type { AdminStats, RecentProof } from "@/types/admin";
import { formatDateTime } from "@/lib/utils";

export function AdminOverviewPage() {
  useDocumentTitle("Admin overview");
  const toast = useToast();
  const { user } = useAuth();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { data, loading, error, reload } = useAsync(
    () => http.get<{ stats: AdminStats; recent: BookingDTO[]; recentProofs: RecentProof[] }>("/api/admin/stats"),
    [],
  );

  async function resetRevenue() {
    setResetting(true);
    try {
      const r = await http.post<{ clearedTotal: number }>("/api/admin/revenue/reset", { confirm: "RESET" });
      toast.success("Revenue cleared", `${formatNaira(r.clearedTotal)} was cleared. Totals start again from now.`);
      setConfirmReset(false);
      reload();
    } catch (err) {
      toast.error("Could not clear revenue", err instanceof HttpError ? err.message : "Please try again.");
    } finally {
      setResetting(false);
    }
  }

  if (loading && !data) return <LoadingBlock />;
  if (error || !data) {
    return (
      <Alert tone="danger">
        {error ?? "Could not load the dashboard."}{" "}
        <button type="button" onClick={reload} className="font-semibold underline">
          Retry
        </button>
      </Alert>
    );
  }

  const { stats, recent, recentProofs = [] } = data;
  const cards = [
    { label: "Total bookings", value: stats.totalBookings, href: "/admin/bookings" },
    { label: "Pending", value: stats.pendingBookings, href: "/admin/bookings?status=pending" },
    {
      label: "Active deliveries",
      value: stats.activeDeliveries,
      href: "/admin/bookings?status=confirmed",
    },
    {
      label: "Completed",
      value: stats.completedDeliveries,
      href: "/admin/bookings?status=delivered",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          {stats.recentBookings} new booking{stats.recentBookings === 1 ? "" : "s"} in the last 7 days
        </p>
      </div>

      <ShippingAttention />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="min-w-0 rounded-2xl border border-line bg-paper shadow-card p-4 transition hover:border-ink sm:p-5"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">
              {c.label}
            </p>
            <p className="mt-1.5 text-2xl font-bold leading-tight font-mono tabular-nums [overflow-wrap:anywhere] sm:mt-2 sm:text-3xl">
              {c.value}
            </p>
          </Link>
        ))}
      </div>

      {user?.superAdmin ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>
            {stats.revenueClearedAt
              ? `Revenue counted from ${formatDateTime(stats.revenueClearedAt)} (${formatNaira(stats.revenueClearedTotal ?? 0)} was cleared).`
              : "Revenue counts every successful payment."}
          </span>
          <Button size="sm" variant="secondary" onClick={() => setConfirmReset(true)}>
            Clear revenue
          </Button>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetRevenue}
        loading={resetting}
        title="Clear all revenue?"
        confirmLabel="Yes, clear revenue"
        message={
          <div className="space-y-2">
            <p>
              Are you sure? Total revenue ({formatNaira(stats.revenue)}) and revenue this month ({formatNaira(stats.revenueThisMonth)}) go back to {formatNaira(0)} and count again only from now.
            </p>
            <p className="text-muted">Payment records themselves are kept for your audit trail and any dispute. To remove a specific payment, delete its shipment or booking.</p>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="min-w-0 rounded-2xl border border-line bg-paper shadow-card p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">
            Total revenue
          </p>
          <p className="mt-1.5 text-xl font-bold leading-tight font-mono tabular-nums [overflow-wrap:anywhere] sm:mt-2 sm:text-2xl">
            {formatNaira(stats.revenue)}
          </p>
        </div>
        <div className="min-w-0 rounded-2xl border border-line bg-paper shadow-card p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">
            Revenue this month
          </p>
          <p className="mt-1.5 text-xl font-bold leading-tight font-mono tabular-nums [overflow-wrap:anywhere] sm:mt-2 sm:text-2xl">
            {formatNaira(stats.revenueThisMonth)}
          </p>
        </div>
        <div className="col-span-2 min-w-0 rounded-2xl border border-line bg-paper shadow-card p-4 sm:col-span-1 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">
            Customers
          </p>
          <p className="mt-1.5 text-xl font-bold leading-tight font-mono tabular-nums [overflow-wrap:anywhere] sm:mt-2 sm:text-2xl">
            {stats.customers}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Link
          href="/admin/partners"
          className="min-w-0 rounded-2xl border border-line bg-paper shadow-card p-4 transition hover:border-ink sm:p-5"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">Owed by partners</p>
          <p className="mt-1.5 text-xl font-bold leading-tight font-mono tabular-nums [overflow-wrap:anywhere] sm:mt-2 sm:text-2xl">
            {formatNaira(stats.partnerOutstanding ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {stats.partnersOwing ? `${stats.partnersOwing} partner${stats.partnersOwing === 1 ? "" : "s"} owing` : "All settled"}
          </p>
        </Link>
        <Link
          href="/admin/bookings?status=returned"
          className="min-w-0 rounded-2xl border border-line bg-paper shadow-card p-4 transition hover:border-ink sm:p-5"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">Returned orders</p>
          <p className="mt-1.5 text-xl font-bold leading-tight font-mono tabular-nums sm:mt-2 sm:text-2xl">
            {stats.returnedBookings ?? 0}
          </p>
        </Link>
      </div>

      {recentProofs.length > 0 ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Recent handovers</h2>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
            {recentProofs.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/bookings/${p.bookingReference}`}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm transition hover:bg-surface"
                >
                  <span className="min-w-0">
                    <span className="font-mono font-bold">{p.bookingReference}</span>{" "}
                    <span className="text-ink-soft">
                      {p.stage === "pickup" ? "picked up" : "delivered"}
                      {p.riderName ? ` by ${p.riderName}` : ""}
                    </span>
                    <span className="block text-xs text-muted">
                      {formatDateTime(p.takenAt)} · {p.photoIds.length} photo{p.photoIds.length === 1 ? "" : "s"}
                      {p.location?.distanceFromTargetM !== undefined
                        ? ` · ${
                            p.location.distanceFromTargetM >= 1000
                              ? `${(p.location.distanceFromTargetM / 1000).toFixed(1)} km`
                              : `${p.location.distanceFromTargetM} m`
                          } from the address`
                        : ""}
                    </span>
                  </span>
                  {p.location?.flagged ? (
                    <span className="shrink-0 rounded-sm bg-[var(--color-warning)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-paper">
                      Check location
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold text-[var(--color-success)]">Verified</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Recent bookings</h2>
          <Link href="/admin/bookings" className="text-sm font-semibold text-ink-soft hover:text-ink">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState className="mt-3" title="No bookings yet" />
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
            <div className="overflow-x-auto">
              <table className="hidden w-full text-sm md:table">
                <thead className="border-b border-line bg-surface text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 font-bold">Reference</th>
                    <th className="px-4 py-3 font-bold">Customer</th>
                    <th className="px-4 py-3 font-bold">Route</th>
                    <th className="px-4 py-3 font-bold">Amount</th>
                    <th className="px-4 py-3 font-bold">Payment</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((b) => (
                    <AdminBookingRow key={b.id} booking={b} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-line md:hidden">
              {recent.map((b) => (
                <AdminBookingRow key={b.id} booking={b} card />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
