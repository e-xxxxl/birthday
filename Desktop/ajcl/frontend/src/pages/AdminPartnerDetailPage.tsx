import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/Badge";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/Feedback";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import { cn, formatDate, formatDateTime, formatNaira } from "@/lib/utils";
import { toNumber } from "@/pages/AdminPartnersPage";
import type { PartnerAccountDTO, PartnerLedgerDTO, PartnerPaymentDTO } from "@/types";

const METHODS = [
  { value: "transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];
const today = () => new Date().toISOString().slice(0, 10);

type Detail = { partner: PartnerAccountDTO; ledger: PartnerLedgerDTO };

export function AdminPartnerDetailPage() {
  const { id = "" } = useParams();
  useDocumentTitle("Partner");
  const { data, loading, error, reload } = useAsync(
    () => http.get<Detail>(`/api/admin/partners/${encodeURIComponent(id)}`),
    [id],
  );

  if (loading && !data) return <LoadingBlock label="Loading partner…" />;
  if (error || !data) {
    return (
      <EmptyState
        title="Partner not found"
        description={error ?? "We couldn't find that partner."}
        action={
          <Link href="/admin/partners" className="font-semibold text-ink hover:underline">
            ← All partners
          </Link>
        }
      />
    );
  }
  // Re-mount the forms whenever the saved data changes, so they always show what's stored.
  return <PartnerView key={`${data.partner.markupPercent}|${data.partner.creditLimit}|${data.partner.active}|${data.ledger.payments.length}`} detail={data} reload={reload} />;
}

function PartnerView({ detail, reload }: { detail: Detail; reload: () => void }) {
  const { partner, ledger } = detail;
  const toast = useToast();

  /* settings */
  const [company, setCompany] = useState(partner.company ?? "");
  const [markup, setMarkup] = useState(String(partner.markupPercent));
  const [limit, setLimit] = useState(partner.creditLimit ? String(partner.creditLimit) : "");
  const [notes, setNotes] = useState(partner.notes ?? "");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  async function saveSettings(active?: boolean) {
    setSavingSettings(true);
    setSettingsError(null);
    try {
      await http.patch(`/api/admin/partners/${partner.id}`, {
        company,
        markupPercent: toNumber(markup) ?? 0,
        creditLimit: toNumber(limit) ?? null,
        notes,
        ...(active !== undefined ? { active } : {}),
      });
      toast.success(active === false ? "Partner deactivated" : active === true ? "Partner reactivated" : "Settings saved");
      reload();
    } catch (err) {
      setSettingsError(err instanceof HttpError ? err.message : "Could not save.");
    } finally {
      setSavingSettings(false);
    }
  }

  /* record payment */
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("transfer");
  const [reference, setReference] = useState("");
  const [received, setReceived] = useState(today());
  const [payNote, setPayNote] = useState("");
  const [recording, setRecording] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const amountN = toNumber(amount) ?? 0;
  const after = Math.round((ledger.outstanding - amountN) * 100) / 100;

  async function record(e: React.FormEvent) {
    e.preventDefault();
    setRecording(true);
    setPayError(null);
    try {
      await http.post(`/api/admin/partners/${partner.id}/payments`, {
        amount: amountN,
        method,
        reference: reference || undefined,
        note: payNote || undefined,
        receivedAt: received || undefined,
      });
      toast.success("Payment recorded", `${formatNaira(amountN)} applied to ${partner.company || partner.fullName}.`);
      setAmount("");
      setReference("");
      setPayNote("");
      reload();
    } catch (err) {
      setPayError(err instanceof HttpError ? err.message : "Could not record the payment.");
    } finally {
      setRecording(false);
    }
  }

  const [removeTarget, setRemoveTarget] = useState<PartnerPaymentDTO | null>(null);
  async function removePayment() {
    if (!removeTarget) return;
    try {
      await http.del(`/api/admin/partners/${partner.id}/payments/${removeTarget.id}`);
      toast.success("Payment removed");
      setRemoveTarget(null);
      reload();
    } catch (err) {
      toast.error("Could not remove", err instanceof HttpError ? err.message : "");
    }
  }

  const cards = [
    { label: "Total billed", value: formatNaira(ledger.billed) },
    { label: "Total paid", value: formatNaira(ledger.paid) },
    {
      label: ledger.credit > 0 ? "Credit on account" : "Outstanding",
      value: formatNaira(ledger.credit > 0 ? ledger.credit : ledger.outstanding),
      tone: ledger.outstanding > 0 ? "owing" : "clear",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/partners" className="text-sm font-semibold text-muted hover:text-ink">
          ← All partners
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">{partner.company || partner.fullName}</h1>
            <p className="text-sm text-muted">
              {partner.company ? `${partner.fullName} · ` : ""}
              {partner.email} · {partner.phone}
            </p>
          </div>
          <span
            className={cn(
              "rounded-sm px-3 py-1 text-xs font-bold uppercase tracking-wide",
              partner.active ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : "bg-surface-2 text-muted",
            )}
          >
            {partner.active ? "Active partner" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {cards.map((c) => (
          <div key={c.label} className="min-w-0 rounded-2xl border border-line bg-paper shadow-card p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">{c.label}</p>
            <p
              className={cn(
                "mt-1.5 text-2xl font-bold font-mono tabular-nums [overflow-wrap:anywhere]",
                c.tone === "owing" && "text-[var(--color-warning)]",
                c.tone === "clear" && "text-[var(--color-success)]",
              )}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Record a payment" description="Money the partner has paid you outside the app." />
          <CardBody>
            {payError ? <Alert tone="danger" className="mb-3">{payError}</Alert> : null}
            <form onSubmit={record} className="space-y-3" noValidate>
              <Input
                label="Amount (₦)"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                hint={
                  amountN > 0
                    ? after > 0
                      ? `They would still owe ${formatNaira(after)}.`
                      : after === 0
                        ? "This settles their account in full."
                        : `This leaves ${formatNaira(-after)} of credit on their account.`
                    : ledger.outstanding > 0
                      ? `They currently owe ${formatNaira(ledger.outstanding)}.`
                      : undefined
                }
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value)}>
                  {METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
                <Input label="Date received" type="date" max={today()} value={received} onChange={(e) => setReceived(e.target.value)} />
              </div>
              <Input label="Reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transfer ref, cheque no." />
              <Input label="Note (optional)" value={payNote} onChange={(e) => setPayNote(e.target.value)} />
              <Button type="submit" loading={recording} disabled={amountN <= 0}>
                Record payment
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pricing & limits" description="Only the admin sees these." />
          <CardBody className="space-y-3">
            {settingsError ? <Alert tone="danger">{settingsError}</Alert> : null}
            <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Price markup (%)"
                type="number"
                inputMode="decimal"
                step="0.5"
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
                hint="Added to every fare. Negative = discount."
              />
              <Input
                label="Credit limit (₦)"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="No limit"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                hint="The most they can owe at once."
              />
            </div>
            <Textarea label="Internal notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" loading={savingSettings} onClick={() => saveSettings()}>
                Save settings
              </Button>
              <Button variant="secondary" size="sm" disabled={savingSettings} onClick={() => saveSettings(!partner.active)}>
                {partner.active ? "Deactivate partner" : "Reactivate partner"}
              </Button>
            </div>
            {!partner.active ? (
              <p className="text-xs text-muted">
                Inactive partners are quoted normal prices and can&apos;t place new orders on account. Their
                existing balance stays on record.
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Orders on account" description="Payments are applied to the oldest orders first." />
        <CardBody className="p-0">
          {ledger.orders.length === 0 ? (
            <p className="p-5 text-sm text-muted">No orders on account yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {[...ledger.orders].reverse().map((o) => (
                <li key={o.reference} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4">
                  <div className="min-w-0">
                    <Link href={`/admin/bookings/${o.reference}`} className="font-mono text-sm font-bold hover:underline">
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
                      <p className="text-sm font-bold font-mono tabular-nums">{formatNaira(o.total)}</p>
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
        <CardHeader title="Payments recorded" />
        <CardBody className="p-0">
          {ledger.payments.length === 0 ? (
            <p className="p-5 text-sm text-muted">No payments recorded yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {ledger.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                  <div>
                    <p className="font-semibold">
                      {METHODS.find((m) => m.value === p.method)?.label ?? p.method}
                      {p.reference ? <span className="font-normal text-muted"> · {p.reference}</span> : null}
                    </p>
                    <p className="text-xs text-muted">
                      Received {formatDateTime(p.receivedAt)}
                      {p.recordedByName ? ` · recorded by ${p.recordedByName}` : ""}
                    </p>
                    {p.note ? <p className="text-xs text-ink-soft">{p.note}</p> : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold font-mono tabular-nums text-[var(--color-success)]">{formatNaira(p.amount)}</p>
                    <Button variant="ghost" size="sm" className="text-[var(--color-danger)]" onClick={() => setRemoveTarget(p)}>
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={removePayment}
        title="Remove this payment?"
        confirmLabel="Remove payment"
        message={
          <>
            The <strong>{removeTarget ? formatNaira(removeTarget.amount) : ""}</strong> payment will be taken off{" "}
            {partner.company || partner.fullName}&apos;s account and their balance will go back up. Use this for
            entries made by mistake.
          </>
        }
      />
    </div>
  );
}
