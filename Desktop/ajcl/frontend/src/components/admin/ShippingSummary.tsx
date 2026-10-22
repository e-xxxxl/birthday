import { AppLink as Link } from "@/components/ui/AppLink";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { http } from "@/lib/http";
import { formatNaira } from "@/lib/utils";

type Summary = {
  counts: Record<string, number>;
  needsAttention: { toReceive: number; toWeigh: number; bookingFailed: number; paid: number };
  wallet: { balanceNgn: number | null; low: boolean; error: string | null; thresholdNgn: number } | null;
};

/** Super Admin only: warns when the carrier wallet is low, on every admin page. */
export function WalletBanner() {
  const { user } = useAuth();
  const { data } = useAsync(
    () => (user?.superAdmin ? http.get<Summary>("/api/admin/shipping/summary").catch(() => null) : Promise.resolve(null)),
    [user?.superAdmin],
  );
  const w = data?.wallet;
  if (!w?.low) return null;
  return (
    <div role="alert" className="border-b border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
      <div className="container-page flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
        <p>
          <strong>Carrier wallet is low:</strong> {w.balanceNgn != null ? formatNaira(w.balanceNgn) : "balance unknown"} (alert level{" "}
          {formatNaira(w.thresholdNgn)}). Paid shipments cannot be booked until it is topped up.
        </p>
        <Link href="/admin/shipping" className="font-semibold underline">
          Open shipping settings
        </Link>
      </div>
    </div>
  );
}

/** Shipments that need someone's attention, for the overview page. */
export function ShippingAttention() {
  const { data } = useAsync(() => http.get<Summary>("/api/admin/shipping/summary").catch(() => null), []);
  if (!data) return null;
  const n = data.needsAttention;
  const items = [
    { label: "To receive", value: n.toReceive, href: "/admin/shipments" },
    { label: "To weigh and quote", value: n.toWeigh, href: "/admin/shipments" },
    { label: "Paid, booking failed", value: n.bookingFailed, href: "/admin/shipments", danger: true },
  ];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Shipments</h2>
        <Link href="/admin/shipments" className="text-sm font-semibold text-muted hover:text-ink">
          Open desk →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {items.map((i) => (
          <Link
            key={i.label}
            href={i.href}
            className="rounded-2xl border border-line bg-paper shadow-card p-4 transition hover:border-ink"
          >
            <p className="rule-label">{i.label}</p>
            <p className={`mt-1 text-3xl font-bold ${i.danger && i.value > 0 ? "text-[var(--color-danger)]" : ""}`}>{i.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
