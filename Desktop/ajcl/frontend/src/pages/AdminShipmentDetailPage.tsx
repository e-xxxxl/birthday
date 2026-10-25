import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert, LoadingBlock } from "@/components/ui/Feedback";
import { Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/providers/AuthProvider";
import {
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
import { SHIPMENT_STATUS_META, MAX_AUTO_QUOTE_KG } from "@/config/shipping";
import type { Shipment, QuoteOption } from "@/types/shipping";

type Result = { shipment: Shipment };

export function AdminShipmentDetailPage() {
  const { reference = "" } = useParams();
  useDocumentTitle(`Shipment ${reference}`);
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const base = `/api/office/shipments/${encodeURIComponent(reference)}`;

  const { data, loading, error, reload } = useAsync(() => http.get<Result>(base), [reference]);
  const [busy, setBusy] = useState<string | null>(null);
  const [code, setCode] = useState<{ code: string; used: boolean } | null>(null);
  const [note, setNote] = useState("");
  const [weight, setWeight] = useState("");
  const [dims, setDims] = useState({ l: "", w: "", h: "" });
  const [weighNote, setWeighNote] = useState("");
  const [rates, setRates] = useState<{ options: QuoteOption[]; warnings: string[] } | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [manual, setManual] = useState({ amount: "", carrierName: "", deliveryTime: "" });
  const [bookForm, setBookForm] = useState({ carrierName: "", trackingNumber: "", trackingUrl: "" });
  const [refund, setRefund] = useState({ target: "pickup_fee", amount: "", reason: "", reference: "" });
  const [cancelReason, setCancelReason] = useState("");
  const [offline, setOffline] = useState({ rateId: "", note: "" });

  if (loading && !data) return <LoadingBlock />;
  if (error || !data) return <Alert tone="danger">{error ?? "Shipment not found."}</Alert>;
  const s = data.shipment;

  async function run<T>(key: string, fn: () => Promise<T>, success?: string): Promise<T | undefined> {
    setBusy(key);
    try {
      const res = await fn();
      if (success) toast.success(success);
      return res;
    } catch (err) {
      toast.error("That did not work", err instanceof HttpError ? err.message : "Please try again.");
      return undefined;
    } finally {
      setBusy(null);
    }
  }

  const needsReceipt = ["awaiting_dropoff", "awaiting_pickup", "in_transit_to_office"].includes(s.status);
  const canWeigh = ["received_at_office", "weight_confirmed", "quote_sent"].includes(s.status);
  const canQuote = ["weight_confirmed", "quote_sent"].includes(s.status);
  const manualOnly = s.quote.manualRequired;
  const selectedOption = s.quote.options.find((o) => o.rateId === s.quote.selectedRateId);
  const draftOptions = rates?.options ?? (s.quote.draft ? s.quote.options : []);
  const showCode = s.handover.method === "pickup" && !["pickup_fee_pending", "cancelled"].includes(s.status);
  const canCancel = !["booked", "in_transit", "delivered", "cancelled", "failed"].includes(s.status);
  const hasManualPaid = s.status === "paid" && selectedOption?.manual;
  const trackedByHand = ["booked", "in_transit"].includes(s.status) && !s.terminal.shipmentId && s.terminal.trackingNumber;

  const pickupFee = s.handover.pickupFee;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/shipments" className="text-sm font-semibold text-muted hover:text-ink">
          ← Shipments desk
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-3xl font-bold sm:text-4xl">{s.reference}</h1>
          <ShipmentStatusBadge status={s.status} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {s.shipmentType === "international" ? "International" : "Interstate"} ·{" "}
          {s.handover.method === "pickup" ? "Rider pickup" : "Customer drop-off"} · {s.customer?.name} ({s.customer?.email}, {s.customer?.phone})
        </p>
      </div>

      {s.staff?.prepayError && !s.shippingPayment?.paid ? (
        <Alert tone="warning" title="Carrier prices could not be loaded for the customer">
          {s.staff.prepayError}
        </Alert>
      ) : null}

      {s.staff?.createdBy ? (
        <Alert tone="info" title="Created on the admin side">
          {s.staff.offlinePayment
            ? `Created by ${s.staff.createdBy}. Booked without an online payment (${s.staff.offlinePayment.note}).`
            : `Created by ${s.staff.createdBy}. It is saved in Terminal as a draft and nothing has been charged online.`}
        </Alert>
      ) : null}

      {isAdmin && s.staff?.createdBy && !s.staff.offlinePayment && ["weight_confirmed", "quote_sent"].includes(s.status) ? (
        <Card>
          <CardBody className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Book without an online payment</h2>
              <p className="text-sm text-muted">Use this when the customer paid by transfer or cash, or when it is not charged. It books on Terminal now and uses the carrier wallet.</p>
            </div>
            {s.quote.options.length === 0 ? (
              <Alert tone="warning">No carrier rates yet. Use "Fetch rates" below, then come back here.</Alert>
            ) : (
              <div role="radiogroup" className="space-y-3">
                {s.quote.options.map((o) => (
                  <QuoteOptionCard
                    key={o.rateId}
                    option={o}
                    breakdown
                    selected={(offline.rateId || (s.quote.options.length === 1 ? o.rateId : "")) === o.rateId}
                    onSelect={() => setOffline({ ...offline, rateId: o.rateId })}
                  />
                ))}
              </div>
            )}
            <Input label="How was it paid, or why is it not charged?" required value={offline.note} onChange={(e) => setOffline({ ...offline, note: e.target.value })} placeholder="e.g. Paid by transfer, GTB, 24 Oct" maxLength={300} />
            <Button
              loading={busy === "offline"}
              disabled={s.quote.options.length === 0 || offline.note.trim().length < 3}
              onClick={async () => {
                const rateId = offline.rateId || (s.quote.options.length === 1 ? s.quote.options[0].rateId : "");
                if (!rateId) {
                  toast.error("Choose a delivery option first");
                  return;
                }
                const r = await run("offline", () => http.post<Result>(`${base}/book-without-payment`, { rateId, note: offline.note.trim() }), undefined);
                if (r) {
                  r.shipment.status === "booked" ? toast.success("Booked with the carrier") : toast.error("Waiting to be booked", r.shipment.terminal.bookingError ?? "Check the wallet, then press Book now.");
                  reload();
                }
              }}
            >
              Book on Terminal
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {s.prepay?.paid && !["booked", "in_transit", "delivered"].includes(s.status) ? (
        <Alert tone="info" title={`Paid in advance: ${formatNaira(s.shippingPayment?.amount ?? 0)}`}>
          The customer paid on their own weight ({s.parcel.estimatedWeightKg} kg). Weigh it when it arrives: the same carrier is priced on the real weight, and the customer is asked only for any difference. If there is none, it is booked automatically.
        </Alert>
      ) : null}

      {s.status === "booking_failed" || (s.status === "paid" && !s.terminal.trackingNumber && s.terminal.bookingError) ? (
        <Alert
          tone={s.status === "paid" ? "warning" : "danger"}
          title={s.status === "paid" ? "Paid, waiting to be booked on Terminal" : "Paid, but the carrier booking failed"}
        >
          <p>{s.terminal.bookingError}</p>
          <p className="mt-1">
            {s.status === "paid"
              ? "The customer has paid and the shipment is saved as a draft in Terminal. Fund the Terminal wallet: it is booked automatically within a few minutes, or press Book now."
              : "The customer has paid and has not been refunded. Fix the cause (for example fund the Terminal wallet), then retry."}
          </p>
          {isAdmin ? (
            <Button
              className="mt-3"
              size="sm"
              loading={busy === "retry"}
              onClick={async () => {
                const r = await run("retry", () => http.post<Result>(`${base}/retry-booking`), undefined);
                if (r) {
                  r.shipment.status === "booked" ? toast.success("Booked with the carrier") : toast.error("Still failing", r.shipment.terminal.bookingError);
                  reload();
                }
              }}
            >
              {s.status === "paid" ? "Book now" : "Retry booking"}
            </Button>
          ) : (
            <p className="mt-2 font-semibold">Ask an admin to retry once it is fixed.</p>
          )}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 space-y-6">
          {needsReceipt ? (
            <Card>
              <CardBody className="space-y-3">
                <h2 className="text-2xl font-bold">Confirm the package has arrived</h2>
                <p className="text-sm text-muted">Your name and the time are recorded.</p>
                {showCode ? <CodePanel /> : null}
                <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Condition of the package, anything unusual" />
                <Button
                  loading={busy === "receive"}
                  onClick={async () => {
                    if (await run("receive", () => http.post(`${base}/receive`, { note: note || undefined }), "Marked as received")) reload();
                  }}
                >
                  Confirm received
                </Button>
              </CardBody>
            </Card>
          ) : showCode ? (
            <Card>
              <CardBody>
                <CodePanel />
              </CardBody>
            </Card>
          ) : null}

          {canWeigh ? (
            <Card>
              <CardBody className="space-y-3">
                <h2 className="text-2xl font-bold">Weigh and measure</h2>
                <p className="text-sm text-muted">
                  Customer estimate: {s.parcel.estimatedWeightKg} kg. Enter the real weight; it replaces the estimate and is rounded up to the next whole kg.
                </p>
                {s.confirmed ? (
                  <p className="text-sm">
                    Recorded: <strong>{s.confirmed.weightKg} kg</strong> (billed as {s.quote.billedWeightKg} kg) by {s.confirmed.byName}
                    {s.confirmed.at ? ` on ${formatDateTime(s.confirmed.at)}` : ""}.
                  </p>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-4">
                  <Input label="Weight (kg)" type="number" min="0.01" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} />
                  <Input label="Length (cm)" type="number" min="0" value={dims.l} onChange={(e) => setDims({ ...dims, l: e.target.value })} />
                  <Input label="Width (cm)" type="number" min="0" value={dims.w} onChange={(e) => setDims({ ...dims, w: e.target.value })} />
                  <Input label="Height (cm)" type="number" min="0" value={dims.h} onChange={(e) => setDims({ ...dims, h: e.target.value })} />
                </div>
                <Input label="Note" value={weighNote} onChange={(e) => setWeighNote(e.target.value)} hint="Optional" />
                <Button
                  loading={busy === "weigh"}
                  disabled={!(Number(weight) > 0)}
                  onClick={async () => {
                    const body = {
                      weightKg: Number(weight),
                      dimensions: dims.l && dims.w && dims.h ? { lengthCm: Number(dims.l), widthCm: Number(dims.w), heightCm: Number(dims.h) } : undefined,
                      note: weighNote || undefined,
                    };
                    const r = await run("weigh", () => http.post<Result & { manualRequired: boolean }>(`${base}/weight`, body), "Weight saved");
                    if (r) {
                      setRates(null);
                      setChosen(new Set());
                      reload();
                    }
                  }}
                >
                  {s.confirmed ? "Update weight" : "Save weight"}
                </Button>
              </CardBody>
            </Card>
          ) : null}

          {canQuote ? (
            <Card>
              <CardBody className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Quote for the customer</h2>
                  {s.status === "quote_sent" ? <p className="text-sm text-muted">A quote was sent {s.quote.sentAt ? formatDateTime(s.quote.sentAt) : ""}. Sending again replaces it.</p> : null}
                </div>

                {manualOnly ? (
                  <Alert tone="warning">
                    Billed weight is {s.quote.billedWeightKg} kg, over the {MAX_AUTO_QUOTE_KG} kg limit for automatic rates. Enter the total amount by hand.
                  </Alert>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      loading={busy === "rates"}
                      onClick={async () => {
                        const r = await run("rates", () => http.post<Result & { options: QuoteOption[]; warnings: string[] }>(`${base}/rates`));
                        if (r) {
                          setRates({ options: r.options, warnings: r.warnings });
                          setChosen(new Set(r.options.map((o) => o.rateId)));
                        }
                      }}
                    >
                      {draftOptions.length ? "Fetch rates again" : "Fetch live rates"}
                    </Button>
                    {rates?.warnings.map((w) => (
                      <Alert key={w} tone="warning">{w}</Alert>
                    ))}
                    {draftOptions.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted">Tick the options the customer may choose from.</p>
                        {draftOptions.map((o) => (
                          <label key={o.rateId} className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-5 size-4"
                              checked={chosen.has(o.rateId)}
                              onChange={(e) => {
                                const next = new Set(chosen);
                                e.target.checked ? next.add(o.rateId) : next.delete(o.rateId);
                                setChosen(next);
                              }}
                            />
                            <div className="flex-1">
                              <QuoteOptionCard option={o} breakdown />
                            </div>
                          </label>
                        ))}
                        <Button
                          loading={busy === "quote"}
                          disabled={chosen.size === 0}
                          onClick={async () => {
                            if (await run("quote", () => http.post(`${base}/quote`, { rateIds: [...chosen] }), "Quote sent to the customer")) {
                              setRates(null);
                              reload();
                            }
                          }}
                        >
                          Send quote to customer
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}

                <details className="rounded-sm border border-line p-4" open={manualOnly}>
                  <summary className="cursor-pointer text-sm font-semibold">{manualOnly ? "Enter the amount by hand" : "Or enter an amount by hand (carrier unavailable)"}</summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Input label="Total (NGN)" type="number" min="1" value={manual.amount} onChange={(e) => setManual({ ...manual, amount: e.target.value })} />
                    <Input label="Carrier / service" value={manual.carrierName} onChange={(e) => setManual({ ...manual, carrierName: e.target.value })} hint="Optional" />
                    <Input label="Delivery time" value={manual.deliveryTime} onChange={(e) => setManual({ ...manual, deliveryTime: e.target.value })} hint="Optional" />
                  </div>
                  <Button
                    className="mt-3"
                    variant="secondary"
                    loading={busy === "manual"}
                    disabled={!(Number(manual.amount) > 0)}
                    onClick={async () => {
                      const body = { manual: { amount: Number(manual.amount), carrierName: manual.carrierName || undefined, deliveryTime: manual.deliveryTime || undefined } };
                      if (await run("manual", () => http.post(`${base}/quote`, body), "Quote sent to the customer")) reload();
                    }}
                  >
                    Send manual quote
                  </Button>
                </details>
              </CardBody>
            </Card>
          ) : null}

          {s.status === "quote_sent" || s.status === "paid" || s.status === "booked" || s.status === "booking_failed" || s.status === "in_transit" || s.status === "delivered" ? (
            s.quote.options.length > 0 && !s.quote.draft ? (
              <InfoCard title="Options sent to the customer">
                <div className="space-y-3">
                  {s.quote.options.map((o) => (
                    <QuoteOptionCard
                      key={o.rateId}
                      option={o}
                      breakdown
                      selected={o.rateId === s.quote.selectedRateId}
                      pickupFee={pickupFee ? { amount: pickupFee.amount, paid: pickupFee.paid } : undefined}
                    />
                  ))}
                </div>
              </InfoCard>
            ) : null
          ) : null}

          {hasManualPaid ? (
            <Card>
              <CardBody className="space-y-3">
                <h2 className="text-2xl font-bold">Paid: book it with the carrier</h2>
                <p className="text-sm text-muted">This was quoted by hand, so it is not booked through Terminal. Record the carrier and tracking number once booked.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input label="Carrier" value={bookForm.carrierName} onChange={(e) => setBookForm({ ...bookForm, carrierName: e.target.value })} />
                  <Input label="Tracking number" value={bookForm.trackingNumber} onChange={(e) => setBookForm({ ...bookForm, trackingNumber: e.target.value })} />
                  <Input label="Tracking link" value={bookForm.trackingUrl} onChange={(e) => setBookForm({ ...bookForm, trackingUrl: e.target.value })} hint="Optional" />
                </div>
                <Button
                  loading={busy === "mark"}
                  disabled={bookForm.carrierName.length < 2 || bookForm.trackingNumber.length < 2}
                  onClick={async () => {
                    if (await run("mark", () => http.post(`${base}/mark-booked`, { ...bookForm, trackingUrl: bookForm.trackingUrl || undefined }), "Marked as booked")) reload();
                  }}
                >
                  Mark as booked
                </Button>
              </CardBody>
            </Card>
          ) : null}

          {s.terminal.trackingNumber ? (
            <InfoCard title="Carrier">
              <div className="space-y-1 text-sm">
                <p>{s.terminal.carrierName} · {s.terminal.trackingNumber}</p>
                {s.terminal.shipmentId ? <p className="text-muted">Terminal shipment {s.terminal.shipmentId}{s.terminal.status ? ` · ${s.terminal.status}` : ""}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {s.terminal.shipmentId ? (
                    <Button size="sm" variant="secondary" loading={busy === "sync"} onClick={async () => { if (await run("sync", () => http.post(`${base}/sync`), "Tracking updated")) reload(); }}>
                      Sync tracking
                    </Button>
                  ) : null}
                  {trackedByHand && s.status === "booked" ? (
                    <Button size="sm" variant="secondary" loading={busy === "st"} onClick={async () => { if (await run("st", () => http.post(`${base}/status`, { status: "in_transit" }))) reload(); }}>
                      Mark in transit
                    </Button>
                  ) : null}
                  {trackedByHand ? (
                    <Button size="sm" variant="secondary" loading={busy === "st2"} onClick={async () => { if (await run("st2", () => http.post(`${base}/status`, { status: "delivered" }))) reload(); }}>
                      Mark delivered
                    </Button>
                  ) : null}
                </div>
              </div>
            </InfoCard>
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
                {s.parcel.dimensions.lengthCm ? ` · ${s.parcel.dimensions.lengthCm} x ${s.parcel.dimensions.widthCm} x ${s.parcel.dimensions.heightCm} cm` : ""}
                {s.parcel.declaredValue ? ` · declared ${formatNaira(s.parcel.declaredValue)}` : ""}
              </p>
              {s.parcel.items.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-muted">
                  {s.parcel.items.map((i, n) => (
                    <li key={n}>{i.quantity} x {i.description} ({formatNaira(i.value)} each{i.hsCode ? `, HS ${i.hsCode}` : ""})</li>
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

          <InfoCard title="Money">
            <dl className="space-y-1.5 text-sm">
              {pickupFee ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Pickup fee</dt>
                  <dd>{formatNaira(pickupFee.amount)} · {pickupFee.paid ? "Paid" : "Not paid"}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Shipping total</dt>
                <dd>{s.shippingPayment?.paid ? `${formatNaira(s.shippingPayment.amount ?? 0)} · Paid` : "Not paid"}</dd>
              </div>
              {s.refund?.pickupFee ? <p className="text-xs text-muted">Pickup fee refunded: {formatNaira(s.refund.pickupFee.amount)} ({s.refund.pickupFee.reason}{s.refund.pickupFee.reference ? `, ref ${s.refund.pickupFee.reference}` : ""})</p> : null}
              {s.refund?.shipping ? <p className="text-xs text-muted">Shipping refunded: {formatNaira(s.refund.shipping.amount)} ({s.refund.shipping.reason}{s.refund.shipping.reference ? `, ref ${s.refund.shipping.reference}` : ""})</p> : null}
            </dl>
            {isAdmin && (pickupFee?.paid || s.shippingPayment?.paid) ? (
              <details className="mt-4 rounded-sm border border-line p-3">
                <summary className="cursor-pointer text-sm font-semibold">Record a manual refund</summary>
                <p className="mt-2 text-xs text-muted">Pay the customer back yourself, then record it here. Nothing is sent automatically.</p>
                <div className="mt-3 space-y-3">
                  <label className="block rule-label">
                    Refunding
                    <select
                      className="field-shell mt-1.5 w-full normal-case"
                      value={refund.target}
                      onChange={(e) => setRefund({ ...refund, target: e.target.value })}
                    >
                      {pickupFee?.paid && !s.refund?.pickupFee ? <option value="pickup_fee">Pickup fee</option> : null}
                      {s.shippingPayment?.paid && !s.refund?.shipping ? <option value="shipping">Shipping payment</option> : null}
                    </select>
                  </label>
                  <Input label="Amount (NGN)" type="number" min="0" value={refund.amount} onChange={(e) => setRefund({ ...refund, amount: e.target.value })} />
                  <Input label="Reason" value={refund.reason} onChange={(e) => setRefund({ ...refund, reason: e.target.value })} />
                  <Input label="Transfer reference" value={refund.reference} onChange={(e) => setRefund({ ...refund, reference: e.target.value })} hint="Optional" />
                  <Button
                    size="sm"
                    loading={busy === "refund"}
                    disabled={!(Number(refund.amount) >= 0) || refund.amount === "" || refund.reason.length < 3}
                    onClick={async () => {
                      const body = { target: refund.target, amount: Number(refund.amount), reason: refund.reason, reference: refund.reference || undefined };
                      if (await run("refund", () => http.post(`${base}/refund`, body), "Refund recorded")) reload();
                    }}
                  >
                    Record refund
                  </Button>
                </div>
              </details>
            ) : null}
          </InfoCard>

          {canCancel ? (
            <InfoCard title="Cancel shipment">
              <Input label="Reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} hint="Shown to the customer" />
              <Button
                className="mt-3"
                size="sm"
                variant="danger"
                loading={busy === "cancel"}
                onClick={async () => {
                  if (!window.confirm("Cancel this shipment? The customer is notified. Refunds are recorded separately.")) return;
                  if (await run("cancel", () => http.post(`${base}/cancel`, { reason: cancelReason || undefined }), "Shipment cancelled")) reload();
                }}
              >
                Cancel shipment
              </Button>
            </InfoCard>
          ) : null}

          {s.handover.officeCodeViews && s.handover.officeCodeViews.length > 0 ? (
            <InfoCard title="Rider code views">
              <ul className="space-y-1 text-xs text-muted">
                {s.handover.officeCodeViews.map((v, i) => (
                  <li key={i}>{v.byName} · {formatDateTime(v.at)}</li>
                ))}
              </ul>
            </InfoCard>
          ) : null}

          <InfoCard title="History">
            <ul className="space-y-2 text-xs">
              {[...s.statusHistory].reverse().map((h, i) => (
                <li key={i}>
                  <span className="font-semibold">{SHIPMENT_STATUS_META[h.status].label}</span>
                  <span className="text-muted"> · {formatDateTime(h.at)} · {h.byName ?? h.byRole}</span>
                  {h.note ? <p className="text-muted">{h.note}</p> : null}
                </li>
              ))}
            </ul>
          </InfoCard>
        </div>
      </div>
    </div>
  );

  /** The rider's handover code. Staff only, and every reveal is logged. */
  function CodePanel() {
    return (
      <div className="rounded-sm border border-line bg-surface p-4">
        <p className="text-sm font-semibold">Rider handover code</p>
        <p className="text-xs text-muted">The rider scans or enters this to hand the package over. Revealing it is logged with your name.</p>
        {code ? (
          <p className="mt-2 text-3xl font-bold tracking-[0.3em]">{code.code}{code.used ? <span className="ml-3 text-xs font-semibold tracking-normal text-muted">already used</span> : null}</p>
        ) : (
          <Button
            className="mt-2"
            size="sm"
            variant="secondary"
            loading={busy === "code"}
            onClick={async () => {
              const r = await run("code", () => http.get<{ code: string; used: boolean }>(`${base}/office-code`));
              if (r) {
                setCode(r);
                reload();
              }
            }}
          >
            Reveal code
          </Button>
        )}
      </div>
    );
  }
}
