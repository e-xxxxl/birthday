import { Navigate } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/Feedback";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import { cn, formatDate, formatDateTime, formatNaira } from "@/lib/utils";
import type { PartnerLedgerDTO } from "@/types";

const METHOD: Record<string, string> = { transfer: "Bank transfer", cash: "Cash", cheque: "Cheque", other: "Other" };

/** A partner's own account: what they've been billed, what they've paid, what they still owe. */
export function PartnerStatementPage() {
  useDocumentTitle("Account statement");
  const { user, loading: authLoading } = useAuth();

  const { data, loading, error, reload } = useAsync(
    () => (user?.partner ? http.get<{ ledger: PartnerLedgerDTO }>("/api/partner/statement") : Promise.resolve(null)),
    [user?.partner?.active],
  );

  if (!authLoading && user && !user.partner) return <Navigate to="/dashboard" replace />;
  if ((loading && !data) || authLoading) return <LoadingBlock label="Loading your account…" />;
  if (error || !data) {
    return (
      <Alert tone="danger">
        {error ?? "Could not load your account."}{" "}
        <button type="button" onClick={reload} className="font-semibold underline">
          Retry
        </button>
      </Alert>
    );
  }

  const L = data.ledger;
  const cards = [
    { label: "Total billed", value: formatNaira(L.billed) },
    { label: "Total paid", value: formatNaira(L.paid) },
    {
      label: L.credit > 0 ? "Credit on account" : "Amount owed",
      value: formatNaira(L.credit > 0 ? L.credit : L.outstanding),
      tone: L.outstanding > 0 ? "owing" : "clear",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account statement</h1>
        <p className="mt-1 text-sm text-muted">
          {user?.partner?.company ? `${user.partner.company} · ` : ""}Your orders are billed to this account and
          settled with our team. Nothing is paid in the app.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {cards.map((c) => (
          <div key={c.label} className="min-w-0 rounded-2xl border border-line bg-paper p-4 shadow-card sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">{c.label}</p>
            <p
              className={cn(
                "mt-1.5 text-2xl font-bold leading-tight tabular-nums [overflow-wrap:anywhere] sm:mt-2",
                c.tone === "owing" && "text-[var(--color-warning)]",
                c.tone === "clear" && "text-[var(--color-success)]",
              )}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {L.creditLimit ? (
        <Alert tone="info">
          Credit limit {formatNaira(L.creditLimit)}.{" "}
          {L.availableCredit !== null ? `You have ${formatNaira(L.availableCredit)} left to order against.` : null}
        </Alert>
      ) : null}

      <Card>
        <CardHeader title="Orders" description="Payments we record are applied to your oldest orders first." />
        <CardBody className="p-0">
          {L.orders.length === 0 ? (
            <EmptyState title="No orders on your account yet" description="Orders you place appear here." />
          ) : (
            <ul className="divide-y divide-line">
              {[...L.orders].reverse().map((o) => (
                <li key={o.reference} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/bookings/${o.reference}`}
                      className="font-mono text-sm font-bold hover:underline"
                    >
                      {o.reference}
                    </Link>
                    <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                    <p className="truncate text-xs text-ink-soft">
                      {o.pickup} → {o.destination}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={o.status} />
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">{formatNaira(o.total)}</p>
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          o.settled ? "text-[var(--color-success)]" : o.allocated > 0 ? "text-[var(--color-warning)]" : "text-muted",
                        )}
                      >
                        {o.settled ? "Settled" : o.allocated > 0 ? `${formatNaira(o.allocated)} paid` : "Unpaid"}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Payments received" />
        <CardBody className="p-0">
          {L.payments.length === 0 ? (
            <p className="p-5 text-sm text-muted">No payments recorded yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {L.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                  <div>
                    <p className="font-semibold">{METHOD[p.method] ?? p.method}</p>
                    <p className="text-xs text-muted">
                      {formatDateTime(p.receivedAt)}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </p>
                    {p.note ? <p className="text-xs text-ink-soft">{p.note}</p> : null}
                  </div>
                  <p className="font-bold tabular-nums text-[var(--color-success)]">{formatNaira(p.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
