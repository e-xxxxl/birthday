import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { cn, formatDateTime, formatNaira } from "@/lib/utils";
import {
  DEFAULT_DISCLAIMER,
  SHIPMENT_FLOW_CARRIER,
  SHIPMENT_FLOW_DROPOFF,
  SHIPMENT_FLOW_PICKUP,
  SHIPMENT_STATUS_META,
  type ShipmentStatus,
} from "@/config/shipping";
import type { QuoteOption, Shipment } from "@/types/shipping";

/** "Interstate", "International · Export from Nigeria" or "International · Global". */
export function shipmentKindLabel(s: { shipmentType: string; flow?: "export" | "global" }): string {
  if (s.shipmentType !== "international") return "Interstate";
  return s.flow === "export" ? "International · Export from Nigeria" : s.flow === "global" ? "International · Global" : "International";
}

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  const meta = SHIPMENT_STATUS_META[status];
  return (
    <Badge tone={meta.tone}>
      <span aria-hidden className="size-1.5 rounded-sm bg-current" />
      {meta.label}
    </Badge>
  );
}

/** The standard notice about authorised channels. Shown in the footer, on the Express page and at checkout. */
export function DisclaimerNotice({
  paragraphs,
  className,
  tone = "light",
}: {
  paragraphs?: string[];
  className?: string;
  tone?: "light" | "plain" | "dark";
}) {
  const list = paragraphs && paragraphs.length > 0 ? paragraphs : DEFAULT_DISCLAIMER;
  return (
    <aside
      aria-label="Important notice"
      className={cn(
        "text-xs leading-relaxed text-muted",
        tone === "light" && "rounded-2xl bg-surface p-4",
        tone === "dark" && "text-paper/60",
        className,
      )}
    >
      <p className={cn("font-bold uppercase tracking-wide", tone === "dark" ? "text-paper/80" : "text-ink-soft")}>Important notice</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-4">
        {list.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </aside>
  );
}

/** Where a shipment is on its journey. Failed and cancelled shipments are shown as such. */
export function ShipmentTimeline({ shipment }: { shipment: Shipment }) {
  const flow =
    shipment.handover.method === "pickup" ? SHIPMENT_FLOW_PICKUP : shipment.handover.method === "carrier" ? SHIPMENT_FLOW_CARRIER : SHIPMENT_FLOW_DROPOFF;
  const status = shipment.status;
  const at = (s: ShipmentStatus) => shipment.statusHistory.find((h) => h.status === s)?.at;

  // booking_failed sits between paid and booked, failed after in transit.
  const position =
    status === "booking_failed"
      ? flow.indexOf("paid")
      : status === "failed"
        ? flow.indexOf("in_transit")
        : status === "cancelled"
          ? Math.max(
              0,
              ...shipment.statusHistory.map((h) => flow.indexOf(h.status)).filter((i) => i >= 0),
            )
          : flow.indexOf(status);

  return (
    <ol className="relative space-y-4">
      {flow.map((s, i) => {
        const done = i < position || (i === position && (status === "delivered" || status === "cancelled"));
        const current = i === position && status !== "delivered" && status !== "cancelled";
        const meta = SHIPMENT_STATUS_META[s];
        const when = at(s);
        return (
          <li key={s} className="relative flex gap-3">
            {i < flow.length - 1 ? (
              <span
                aria-hidden
                className={cn("absolute left-[11px] top-6 h-[calc(100%-4px)] w-px", done ? "bg-ink" : "bg-line-strong")}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-sm border text-[10px] font-bold",
                done && "border-ink bg-ink text-paper",
                current && "border-ink bg-accent text-ink",
                !done && !current && "border-line-strong bg-paper text-muted",
              )}
            >
              {done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 pb-1">
              <p className={cn("text-sm font-semibold", !done && !current && "text-muted")}>{meta.label}</p>
              {current ? <p className="text-xs text-muted">{meta.description}</p> : null}
              {when && (done || current) ? <p className="text-xs text-muted">{formatDateTime(when)}</p> : null}
            </div>
          </li>
        );
      })}
      {status === "booking_failed" ? (
        <li className="rounded-sm bg-[var(--color-warning-soft)] p-3 text-xs text-[var(--color-warning)]">
          {SHIPMENT_STATUS_META.booking_failed.description}
        </li>
      ) : null}
      {status === "failed" || status === "cancelled" ? (
        <li className="rounded-sm bg-[var(--color-danger-soft)] p-3 text-xs text-[var(--color-danger)]">
          <strong>{SHIPMENT_STATUS_META[status].label}.</strong> {SHIPMENT_STATUS_META[status].description}
          {shipment.cancelledReason ? ` Reason: ${shipment.cancelledReason}` : ""}
        </li>
      ) : null}
    </ol>
  );
}

function Row({ label, value, strong }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-1.5 text-sm", strong && "font-bold")}>
      <dt className={cn(!strong && "text-muted")}>{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * One carrier option. Customers see the carrier, the delivery time and one total; staff pass `breakdown` to see how
 * the price is built. The pickup fee is shown as its own "Paid" line and is not part of the total to pay now.
 */
export function QuoteOptionCard({
  option,
  selected,
  onSelect,
  pickupFee,
  footer,
  breakdown = false,
}: {
  breakdown?: boolean;
  option: QuoteOption;
  selected?: boolean;
  onSelect?: () => void;
  pickupFee?: { amount: number; paid: boolean };
  footer?: React.ReactNode;
}) {
  const foreign = breakdown && option.sourceCurrency !== "NGN";
  const interactive = Boolean(onSelect);
  return (
    <div
      role={interactive ? "radio" : undefined}
      aria-checked={interactive ? selected : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        "rounded-sm border p-4 transition",
        interactive && "cursor-pointer",
        selected ? "border-ink bg-ink/[0.03] ring-1 ring-ink" : "border-line-strong",
        interactive && !selected && "hover:border-ink",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {option.carrierLogo ? (
            <img src={option.carrierLogo} alt="" className="size-9 shrink-0 rounded-sm object-contain" loading="lazy" />
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-bold">{option.carrierName}</p>
            {option.deliveryTime ? <p className="text-xs text-muted">{option.deliveryTime}</p> : null}
          </div>
        </div>
        <p className="shrink-0 text-lg font-bold font-mono tabular-nums">{formatNaira(option.total)}</p>
      </div>

      <dl className={cn(breakdown || pickupFee ? "mt-3 border-t border-line pt-2" : "")}>
        {breakdown ? (
          <>
            {option.manual ? (
              <Row label="Shipping" value={formatNaira(option.total)} />
            ) : (
              <>
                <Row label="Carrier rate" value={formatNaira(option.baseRate)} />
                <Row label={`Service fee (${option.tierPercent}%)`} value={formatNaira(option.markup)} />
                <Row label="Handling" value={formatNaira(option.flatFee)} />
                <Row label="Surcharge" value={formatNaira(option.surcharge)} />
              </>
            )}
            <Row label="Shipping total" value={formatNaira(option.total)} strong />
          </>
        ) : null}
        {pickupFee ? (
          <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-dashed border-line py-1.5 text-xs text-muted">
            <span>
              Pickup fee ({pickupFee.paid ? "Paid" : "Not yet paid"}, not included above)
            </span>
            <span className="font-mono tabular-nums">{formatNaira(pickupFee.amount)}</span>
          </div>
        ) : null}
      </dl>

      {foreign && !option.manual ? (
        <p className="mt-2 text-xs text-muted">
          Carrier quoted {option.sourceCurrency} {option.sourceAmount.toLocaleString("en-NG")}, converted at{" "}
          {formatNaira(option.fxRate)} per {option.sourceCurrency}
          {option.fxRateUpdatedAt ? ` (rate last updated ${formatDateTime(option.fxRateUpdatedAt)})` : ""}.
        </p>
      ) : null}
      {footer}
    </div>
  );
}

export function InfoCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardBody>
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{title}</h2>
        <div className="mt-3">{children}</div>
      </CardBody>
    </Card>
  );
}

export function PartyBlock({ title, party }: { title: string; party: Shipment["sender"] }) {
  return (
    <div className="min-w-0 text-sm">
      <p className="rule-label">{title}</p>
      <p className="mt-1 font-semibold">{party.name}</p>
      <p className="text-ink-soft">{party.phone}</p>
      {party.email ? <p className="truncate text-ink-soft">{party.email}</p> : null}
      <p className="mt-1 text-muted">
        {[party.line1, party.line2, party.city, party.state, party.zip, party.country].filter(Boolean).join(", ")}
      </p>
    </div>
  );
}
