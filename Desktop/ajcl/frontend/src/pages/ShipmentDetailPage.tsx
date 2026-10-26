import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert, LoadingBlock } from "@/components/ui/Feedback";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  DisclaimerNotice,
  InfoCard,
  PartyBlock,
  QuoteOptionCard,
  ShipmentStatusBadge,
  ShipmentTimeline,
} from "@/components/shipping/ShipmentBits";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http, HttpError } from "@/lib/http";
import { formatDateTime, formatNaira } from "@/lib/utils";
import { SHIPMENT_STATUS_META } from "@/config/shipping";
import type { Shipment, ShippingConfig } from "@/types/shipping";

/** What we tell an international customer who pays before the parcel is weighed. */
export function weightNotice(declaredKg: number): string {
  return `This price is based on the ${declaredKg} kg you entered. When we weigh your package at our office, if it is heavier you will be asked to pay the additional fee before it ships. If it weighs the same or less, you pay nothing more.`;
}

export function ShipmentDetailPage() {
  const { reference = "" } = useParams();
  useDocumentTitle(`Shipment ${reference}`);
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(
    () => http.get<{ shipment: Shipment }>(`/api/shipments/${encodeURIComponent(reference)}`),
    [reference],
  );
  const { data: config } = useAsync(() => http.get<ShippingConfig>("/api/shipments/config"), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (loading && !data) return <LoadingBlock />;
  if (error || !data) return <Alert tone="danger">{error ?? "Shipment not found."}</Alert>;
  const s = data.shipment;
  const meta = SHIPMENT_STATUS_META[s.status];
  const international = s.shipmentType === "international";
  const pickupFee = s.handover.pickupFee;
  // A carrier picked in the wizard is already selected here.
  let chosenInWizard: string | undefined;
  try {
    const name = sessionStorage.getItem(`ajc:carrier:${s.reference}`);
    chosenInWizard = s.prepay?.available ? s.quote.options.find((o) => o.carrierName === name)?.rateId : undefined;
  } catch {
    /* ignore */
  }
  const pick = selected ?? chosenInWizard ?? null;

  async function payPickup() {
    if (!s.handover.pickupBookingReference) return;
    setBusy("pickup");
    try {
      const res = await http.post<{ authorizationUrl: string }>("/api/payments/initialize", {
        bookingReference: s.handover.pickupBookingReference,
      });
      window.location.href = res.authorizationUrl;
    } catch (err) {
      toast.error("Could not start payment", err instanceof HttpError ? err.message : undefined);
      setBusy(null);
    }
  }

  async function payShipping(bundlePickup = false) {
    const rateId = pick ?? (s.quote.options.length === 1 ? s.quote.options[0].rateId : null);
    if (!rateId) {
      toast.error("Choose a delivery option first");
      return;
    }
    setBusy("shipping");
    try {
      const res = await http.post<{ authorizationUrl: string }>(`/api/shipments/${s.reference}/pay`, { rateId, includePickupFee: bundlePickup ? true : undefined });
      window.location.href = res.authorizationUrl;
    } catch (err) {
      toast.error("Could not start payment", err instanceof HttpError ? err.message : undefined);
      setBusy(null);
    }
  }

  async function refresh() {
    setBusy("refresh");
    try {
      await http.post(`/api/shipments/${s.reference}/refresh`);
      reload();
    } catch (err) {
      toast.error("Could not refresh", err instanceof HttpError ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy("cancel");
    try {
      await http.post(`/api/shipments/${s.reference}/cancel`, {});
      toast.success("Shipment cancelled");
      setConfirmCancel(false);
      reload();
    } catch (err) {
      toast.error("Could not cancel", err instanceof HttpError ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  const canCancel = ["pickup_fee_pending", "awaiting_dropoff", "weight_confirmed", "quote_sent"].includes(s.status);
  const office = config?.office;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/shipments" className="text-sm font-semibold text-muted hover:text-ink">
          ← My shipments
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-3xl font-bold sm:text-4xl">{s.reference}</h1>
          <ShipmentStatusBadge status={s.status} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {international ? "International" : "Interstate"} shipment{s.createdAt ? ` · created ${formatDateTime(s.createdAt)}` : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 space-y-6">
          {/* What to do next */}
          {s.status === "pickup_fee_pending" ? (
            <Card>
              <CardBody className="space-y-3">
                <h2 className="text-2xl font-bold">Pay the pickup fee</h2>
                <p className="text-sm text-muted">{meta.description}</p>
                {pickupFee ? <p className="text-2xl font-bold font-mono tabular-nums">{formatNaira(pickupFee.amount)}</p> : null}
                {config ? (
                  <div className="rounded-sm border border-line bg-surface p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Refund policy</p>
                    <p className="mt-1 whitespace-pre-line text-xs text-muted">{config.refundPolicyText}</p>
                  </div>
                ) : null}
                <Button onClick={payPickup} loading={busy === "pickup"}>
                  Pay pickup fee
                </Button>
              </CardBody>
            </Card>
          ) : null}

          {s.status === "awaiting_dropoff" ? (
            <Card>
              <CardBody className="space-y-2 text-sm">
                <h2 className="text-2xl font-bold">Bring your package to our office</h2>
                {office?.line1 ? (
                  <>
                    <p className="font-semibold">{[office.line1, office.line2, office.city, office.state].filter(Boolean).join(", ")}</p>
                    <p className="text-muted">{office.openingHours}</p>
                    {office.phone ? <p className="text-muted">{office.phone}</p> : null}
                  </>
                ) : null}
                <p>
                  Quote your booking reference: <strong className="font-mono rounded bg-surface px-2 py-0.5 text-base">{s.reference}</strong>
                </p>
              </CardBody>
            </Card>
          ) : null}

          {s.prepay?.available ? (
            <Card>
              <CardBody className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Pay for shipping now</h2>
                  <p className="text-sm text-muted">Choose a carrier and pay straight away. You do not need to wait for us to weigh your package.</p>
                </div>
                <div role="radiogroup" className="space-y-3">
                  {s.quote.options.map((o) => (
                    <QuoteOptionCard
                      key={o.rateId}
                      option={o}
                      selected={(pick ?? (s.quote.options.length === 1 ? o.rateId : null)) === o.rateId}
                      onSelect={() => setSelected(o.rateId)}
                    />
                  ))}
                </div>
                <Alert tone="warning" title="If the weight is different">
                  {weightNotice(s.parcel.estimatedWeightKg)}
                </Alert>
                {config ? <Alert tone="warning">{config.dutiesNotice}</Alert> : null}
                <DisclaimerNotice paragraphs={config?.disclaimerParagraphs} />
                {s.status === "pickup_fee_pending" && pickupFee && !pickupFee.paid ? (
                  <Button size="lg" onClick={() => payShipping(true)} loading={busy === "shipping"}>
                    Pay pickup fee and shipping
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => payShipping()} loading={busy === "shipping"}>
                    Pay shipping now
                  </Button>
                )}
              </CardBody>
            </Card>
          ) : null}

          {s.prepay?.paid && s.status !== "quote_sent" && !["paid", "booked", "in_transit", "delivered", "booking_failed", "failed", "cancelled"].includes(s.status) ? (
            <Alert tone="success" title={`Shipping paid: ${formatNaira(s.shippingPayment?.amount ?? 0)}`}>
              {weightNotice(s.parcel.estimatedWeightKg)}
            </Alert>
          ) : null}

          {s.status === "quote_sent" && s.prepay?.paid ? (
            <Card>
              <CardBody className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Additional fee to ship</h2>
                  <p className="text-sm text-muted">
                    You entered {s.parcel.estimatedWeightKg} kg. We weighed your package at {s.confirmed?.weightKg} kg (billed as {s.quote.billedWeightKg} kg).
                  </p>
                </div>
                <p className="text-3xl font-bold font-mono tabular-nums">{formatNaira(s.prepay.additionalDue)}</p>
                <p className="text-sm text-muted">You already paid {formatNaira(s.shippingPayment?.amount ?? 0)}. This is only the difference for the extra weight.</p>
                <Button size="lg" onClick={() => payShipping()} loading={busy === "shipping"}>
                  Pay the additional fee
                </Button>
              </CardBody>
            </Card>
          ) : null}

          {s.status === "quote_sent" && !s.prepay?.paid ? (
            <Card>
              <CardBody className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Choose how to ship</h2>
                  <p className="text-sm text-muted">
                    Weighed at {s.confirmed?.weightKg} kg, billed as {s.quote.billedWeightKg} kg.
                  </p>
                </div>
                <div role="radiogroup" className="space-y-3">
                  {s.quote.options.map((o) => (
                    <QuoteOptionCard
                      key={o.rateId}
                      option={o}
                      selected={(selected ?? (s.quote.options.length === 1 ? o.rateId : null)) === o.rateId}
                      onSelect={() => setSelected(o.rateId)}
                      pickupFee={pickupFee ? { amount: pickupFee.amount, paid: pickupFee.paid } : undefined}
                    />
                  ))}
                </div>
                {international && config ? <Alert tone="warning">{config.dutiesNotice}</Alert> : null}
                <DisclaimerNotice paragraphs={config?.disclaimerParagraphs} />
                <Button size="lg" onClick={() => payShipping()} loading={busy === "shipping"}>
                  Pay shipping total
                </Button>
              </CardBody>
            </Card>
          ) : null}

          {s.status === "booking_failed" ? <Alert tone="warning">{meta.description}</Alert> : null}

          {["booked", "in_transit", "delivered", "failed"].includes(s.status) ? (
            <Card>
              <CardBody className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold">Tracking</h2>
                  {s.status === "booked" || s.status === "in_transit" ? (
                    <Button size="sm" variant="secondary" onClick={refresh} loading={busy === "refresh"}>
                      Refresh
                    </Button>
                  ) : null}
                </div>
                {s.terminal.carrierName ? <p><span className="text-muted">Carrier:</span> {s.terminal.carrierName}</p> : null}
                {s.terminal.trackingNumber ? (
                  <p>
                    <span className="text-muted">Tracking number:</span> <strong>{s.terminal.trackingNumber}</strong>{" "}
                    {s.terminal.trackingUrl ? (
                      <a href={s.terminal.trackingUrl} target="_blank" rel="noreferrer" className="font-semibold underline">
                        Track on carrier site
                      </a>
                    ) : null}
                  </p>
                ) : null}
                {international && config ? <p className="text-xs text-muted">{config.dutiesNotice}</p> : null}
                {s.terminal.events.length > 0 ? (
                  <ul className="space-y-2 border-t border-line pt-3">
                    {[...s.terminal.events].reverse().map((e, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-1.5 size-2 shrink-0 rounded-sm bg-ink" />
                        <div>
                          <p className="font-semibold capitalize">{e.status.replace(/_/g, " ")}</p>
                          {e.description ? <p className="text-xs text-muted">{e.description}</p> : null}
                          <p className="text-xs text-muted">{formatDateTime(e.at)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardBody>
            </Card>
          ) : null}

          {s.refund?.pickupFee || s.refund?.shipping ? (
            <Alert tone="info" title="Refund recorded">
              {s.refund.pickupFee ? <p>Pickup fee: {formatNaira(s.refund.pickupFee.amount)} refunded. {s.refund.pickupFee.reason}</p> : null}
              {s.refund.shipping ? <p>Shipping: {formatNaira(s.refund.shipping.amount)} refunded. {s.refund.shipping.reason}</p> : null}
            </Alert>
          ) : null}

          <InfoCard title="Parties">
            <div className="grid gap-5 sm:grid-cols-2">
              <PartyBlock title="From" party={s.sender} />
              <PartyBlock title="To" party={s.receiver} />
            </div>
          </InfoCard>

          <InfoCard title="Package">
            <div className="space-y-1 text-sm">
              <p>{s.parcel.description}</p>
              <p className="text-muted">
                Estimated {s.parcel.estimatedWeightKg} kg
                {s.confirmed ? ` · weighed at ${s.confirmed.weightKg} kg` : ""}
              </p>
              {s.parcel.items.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-muted">
                  {s.parcel.items.map((i, n) => (
                    <li key={n}>
                      {i.quantity} x {i.description} ({formatNaira(i.value)} each{i.hsCode ? `, HS ${i.hsCode}` : ""})
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </InfoCard>
        </div>

        <div className="space-y-6">
          <InfoCard title="Progress">
            <ShipmentTimeline shipment={s} />
          </InfoCard>
          {s.handover.pickupBookingReference ? (
            <InfoCard title="Rider pickup">
              <p className="text-sm text-muted">
                Pickup fee {pickupFee ? formatNaira(pickupFee.amount) : ""}: {pickupFee?.paid ? "Paid" : "Not yet paid"}.
              </p>
              <Link href={`/dashboard/bookings/${s.handover.pickupBookingReference}`} className="mt-2 inline-block text-sm font-semibold underline">
                Follow the rider ({s.handover.pickupBookingReference})
              </Link>
            </InfoCard>
          ) : null}
          {canCancel ? (
            <Button variant="secondary" onClick={() => setConfirmCancel(true)}>
              Cancel shipment
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancel}
        title="Cancel this shipment?"
        message="This cannot be undone. If you already paid the pickup fee, contact us about a refund."
        confirmLabel="Cancel shipment"
        loading={busy === "cancel"}
      />
    </div>
  );
}
