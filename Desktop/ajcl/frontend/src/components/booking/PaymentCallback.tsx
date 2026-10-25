import { useEffect, useRef, useState } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { useSearchParams } from "react-router-dom";
import { useBookingWizard } from "@/components/booking/BookingWizardContext";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Feedback";
import { http } from "@/lib/http";
import type { BookingDTO } from "@/types";
import type { Shipment } from "@/types/shipping";

type State =
  | { kind: "verifying" }
  | { kind: "paid"; booking: BookingDTO | null; shipment?: Shipment; shipmentRef?: string }
  | { kind: "pending"; booking?: BookingDTO | null; shipmentRef?: string }
  | { kind: "failed"; message: string; bookingRef?: string; shipmentRef?: string };

type VerifyResponse = {
  paid: boolean;
  status: string;
  booking: BookingDTO | null;
  /** Present when the payment was a shipment's carrier price. */
  shipment?: Shipment | null;
  /** Present when the booking was the rider pickup leg of a shipment. */
  shipmentReference?: string;
};

export function PaymentCallback() {
  const [params] = useSearchParams();
  const { reset } = useBookingWizard();
  const [state, setState] = useState<State>({ kind: "verifying" });
  const ran = useRef(false);

  // Paystack appends ?reference=... (and we add &ref=<bookingRef or shipmentRef>)
  const reference = params.get("reference") || params.get("trxref");
  const ref = params.get("ref");
  const isShipmentPayment = params.get("kind") === "shipment";

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!reference) {
      setState({
        kind: "failed",
        message: "No payment reference was provided.",
        bookingRef: isShipmentPayment ? undefined : (ref ?? undefined),
        shipmentRef: isShipmentPayment ? (ref ?? undefined) : undefined,
      });
      return;
    }

    (async () => {
      try {
        const res = await http.get<VerifyResponse>(
          `/api/payments/verify?reference=${encodeURIComponent(reference)}`,
        );
        const shipmentRef = res.shipment?.reference ?? res.shipmentReference;
        if (res.paid) {
          reset();
          setState({ kind: "paid", booking: res.booking, shipment: res.shipment ?? undefined, shipmentRef });
        } else if (res.status === "pending") {
          setState({ kind: "pending", booking: res.booking, shipmentRef });
        } else {
          setState({
            kind: "failed",
            message: "The payment was not completed.",
            bookingRef: res.booking?.bookingReference,
            shipmentRef,
          });
        }
      } catch {
        setState({
          kind: "failed",
          message: "We couldn't verify the payment. Check your dashboard in a moment.",
          bookingRef: isShipmentPayment ? undefined : (ref ?? undefined),
          shipmentRef: isShipmentPayment ? (ref ?? undefined) : undefined,
        });
      }
    })();
  }, [reference, ref, isShipmentPayment, reset]);

  if (state.kind === "verifying") {
    return (
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
          <Spinner className="size-7 text-ink" />
          <p className="font-semibold">Verifying your payment…</p>
          <p className="text-sm text-muted">This only takes a moment. Please don&apos;t close the page.</p>
        </CardBody>
      </Card>
    );
  }

  if (state.kind === "paid") {
    const shipmentHref = state.shipmentRef ? `/dashboard/shipments/${state.shipmentRef}` : null;
    const isShippingTotal = Boolean(state.shipment);
    const bookingFailed = state.shipment?.status === "booking_failed";
    return (
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
          <span aria-hidden className="font-mono text-6xl font-bold leading-none text-[var(--color-success)]">
            ✓
          </span>
          <h1 className="text-xl font-bold">Payment confirmed</h1>
          {isShippingTotal ? (
            <p className="text-sm text-muted">
              Shipment <strong className="text-ink">{state.shipmentRef}</strong> is paid.{" "}
              {bookingFailed
                ? "Your payment is safe. We hit a snag booking with the carrier and our team is on it."
                : "We are booking it with the carrier."}
            </p>
          ) : state.shipmentRef ? (
            <p className="text-sm text-muted">
              Pickup fee received for shipment <strong className="text-ink">{state.shipmentRef}</strong>. A
              rider will collect your package and bring it to our office.
            </p>
          ) : (
            <p className="text-sm text-muted">
              Booking <strong className="text-ink">{state.booking?.bookingReference}</strong> is
              confirmed. We&apos;ll assign a rider shortly.
            </p>
          )}
          <div className="mt-3 flex w-full flex-col gap-2">
            {shipmentHref ? (
              <Button href={shipmentHref} fullWidth>
                View shipment
              </Button>
            ) : state.booking ? (
              <Button href={`/dashboard/bookings/${state.booking.bookingReference}`} fullWidth>
                View booking
              </Button>
            ) : null}
            <Button href="/dashboard" variant="secondary" fullWidth>
              Go to dashboard
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (state.kind === "pending") {
    const href = state.shipmentRef
      ? `/dashboard/shipments/${state.shipmentRef}`
      : state.booking
        ? `/dashboard/bookings/${state.booking.bookingReference}`
        : null;
    return (
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
          <span aria-hidden className="font-mono text-6xl font-bold leading-none text-[var(--color-warning)]">
            •
          </span>
          <h1 className="text-xl font-bold">Payment processing</h1>
          <p className="text-sm text-muted">
            Your payment hasn&apos;t been confirmed yet. It may take a minute. We&apos;ll update it
            automatically.
          </p>
          <div className="mt-3 flex w-full flex-col gap-2">
            <Button onClick={() => window.location.reload()} fullWidth>
              Check again
            </Button>
            {href ? (
              <Button href={href} variant="secondary" fullWidth>
                {state.shipmentRef ? "View shipment" : "View booking"}
              </Button>
            ) : null}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
        <span aria-hidden className="font-mono text-6xl font-bold leading-none text-[var(--color-danger)]">
          !
        </span>
        <h1 className="text-xl font-bold">Payment not completed</h1>
        <p className="text-sm text-muted">{state.message}</p>
        <div className="mt-3 flex w-full flex-col gap-2">
          {state.shipmentRef ? (
            <Button href={`/dashboard/shipments/${state.shipmentRef}`} fullWidth>
              Retry from shipment
            </Button>
          ) : state.bookingRef ? (
            <Button href={`/dashboard/bookings/${state.bookingRef}`} fullWidth>
              Retry from booking
            </Button>
          ) : null}
          <Button href="/dashboard" variant="secondary" fullWidth>
            Go to dashboard
          </Button>
          <Link href="/send" className="mt-1 text-xs font-semibold text-muted hover:text-ink">
            Start a new shipment
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
