
import { useEffect, useRef, useState } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { useSearchParams } from "react-router-dom";
import { useBookingWizard } from "@/components/booking/BookingWizardContext";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Feedback";
import { http } from "@/lib/http";
import type { BookingDTO } from "@/types";

type State =
  | { kind: "verifying" }
  | { kind: "paid"; booking: BookingDTO }
  | { kind: "pending"; booking?: BookingDTO }
  | { kind: "failed"; message: string; bookingRef?: string };

export function PaymentCallback() {
  const [params] = useSearchParams();
  const { reset } = useBookingWizard();
  const [state, setState] = useState<State>({ kind: "verifying" });
  const ran = useRef(false);

  // Paystack appends ?reference=... (and we add &ref=<bookingRef>)
  const reference = params.get("reference") || params.get("trxref");
  const bookingRef = params.get("ref");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!reference) {
      setState({ kind: "failed", message: "No payment reference was provided.", bookingRef: bookingRef ?? undefined });
      return;
    }

    (async () => {
      try {
        const res = await http.get<{ paid: boolean; status: string; booking: BookingDTO }>(
          `/api/payments/verify?reference=${encodeURIComponent(reference)}`,
        );
        if (res.paid) {
          reset();
          setState({ kind: "paid", booking: res.booking });
        } else if (res.status === "pending") {
          setState({ kind: "pending", booking: res.booking });
        } else {
          setState({
            kind: "failed",
            message: "The payment was not completed.",
            bookingRef: res.booking?.bookingReference,
          });
        }
      } catch {
        setState({
          kind: "failed",
          message: "We couldn't verify the payment. Check your dashboard in a moment.",
          bookingRef: bookingRef ?? undefined,
        });
      }
    })();
  }, [reference, bookingRef, reset]);

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
    return (
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[var(--color-success-soft)] text-2xl text-[var(--color-success)]">
            ✓
          </span>
          <h1 className="text-xl font-bold">Payment confirmed</h1>
          <p className="text-sm text-muted">
            Booking <strong className="text-ink">{state.booking.bookingReference}</strong> is
            confirmed. We&apos;ll assign a rider shortly.
          </p>
          <div className="mt-3 flex w-full flex-col gap-2">
            <Button href={`/dashboard/bookings/${state.booking.bookingReference}`} fullWidth>
              View booking
            </Button>
            <Button href="/dashboard" variant="secondary" fullWidth>
              Go to dashboard
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (state.kind === "pending") {
    return (
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[var(--color-warning-soft)] text-2xl text-[var(--color-warning)]">
            •
          </span>
          <h1 className="text-xl font-bold">Payment processing</h1>
          <p className="text-sm text-muted">
            Your payment hasn&apos;t been confirmed yet. It may take a minute — we&apos;ll update the
            booking automatically.
          </p>
          <div className="mt-3 flex w-full flex-col gap-2">
            <Button onClick={() => window.location.reload()} fullWidth>
              Check again
            </Button>
            {state.booking ? (
              <Button
                href={`/dashboard/bookings/${state.booking.bookingReference}`}
                variant="secondary"
                fullWidth
              >
                View booking
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
        <span className="grid size-14 place-items-center rounded-full bg-[var(--color-danger-soft)] text-2xl text-[var(--color-danger)]">
          !
        </span>
        <h1 className="text-xl font-bold">Payment not completed</h1>
        <p className="text-sm text-muted">{state.message}</p>
        <div className="mt-3 flex w-full flex-col gap-2">
          {state.bookingRef ? (
            <Button href={`/dashboard/bookings/${state.bookingRef}`} fullWidth>
              Retry from booking
            </Button>
          ) : null}
          <Button href="/dashboard" variant="secondary" fullWidth>
            Go to dashboard
          </Button>
          <Link href="/book" className="mt-1 text-xs font-semibold text-muted hover:text-ink">
            Start a new booking
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
