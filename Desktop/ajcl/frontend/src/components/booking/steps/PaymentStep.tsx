
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { useBookingWizard } from "@/components/booking/BookingWizardContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { http, HttpError } from "@/lib/http";
import { createBookingSchema } from "@/lib/validation/booking";
import { formatNaira } from "@/lib/utils";
import type { WizardStepProps } from "@/components/booking/BookingWizard";
import type { BookingDTO } from "@/types";

export function PaymentStep({ goBack, config }: WizardStepProps) {
  const { draft, quote, clientRoute } = useBookingWizard();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  // Partners are billed on account, so they place the order instead of paying.
  const isPartner = Boolean(user?.partner);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "creating" | "redirecting">("idle");

  const priced = useMemo(
    () => quote?.vehicles.find((v) => v.vehicle.slug === draft.vehicleSlug),
    [quote, draft.vehicleSlug],
  );

  async function pay() {
    setError(null);

    const payload = {
      pickup: draft.pickup,
      stops: draft.stops.filter((s) => s.formattedAddress),
      destination: draft.destination,
      deliveryType: draft.deliveryType,
      scheduledDate: draft.scheduledDate,
      scheduledTime: draft.scheduledTime,
      vehicleSlug: draft.vehicleSlug,
      sender: draft.sender,
      recipient: {
        ...draft.recipient,
        email: draft.recipient.email || undefined,
      },
      package: draft.package,
      notes: draft.notes,
      clientRoute: clientRoute ?? undefined,
    };

    const parsed = createBookingSchema.safeParse({
      ...payload,
      sender: { ...draft.sender, email: draft.sender.email || undefined },
    });
    if (!parsed.success) {
      setError("Some booking details are invalid. Go back and check each step.");
      return;
    }

    setBusy(true);
    try {
      setStage("creating");
      const { booking } = await http.post<{ booking: BookingDTO }>("/api/bookings", parsed.data);

      if (isPartner) {
        setStage("redirecting");
        await http.post(`/api/bookings/${encodeURIComponent(booking.bookingReference)}/place-on-account`);
        toast.success("Order placed", `${booking.bookingReference} is confirmed and billed to your account.`);
        navigate(`/dashboard/bookings/${booking.bookingReference}`);
        return;
      }

      setStage("redirecting");
      const init = await http.post<{ authorizationUrl: string; reference: string }>(
        "/api/payments/initialize",
        { bookingReference: booking.bookingReference },
      );

      // Hand off to Paystack.
      window.location.href = init.authorizationUrl;
    } catch (err) {
      setBusy(false);
      setStage("idle");
      setError(
        err instanceof HttpError
          ? err.message
          : isPartner
            ? "We couldn't place the order. Please try again."
            : "We couldn't start the payment. Please try again.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Card>
        <CardHeader
          title={isPartner ? "Place your order" : "Payment"}
          description={
            isPartner
              ? "This order is billed to your partner account. There's nothing to pay now."
              : "You'll be redirected to Paystack to complete payment securely."
          }
        />
        <CardBody className="space-y-4">
          {priced ? (
            <PriceBreakdown price={priced.price} />
          ) : (
            <Alert tone="warning">Price information is missing. Go back to the vehicle step.</Alert>
          )}

          {priced && priced.price.total <= 0 ? (
            <Alert tone="danger">
              A fare isn&apos;t available for this booking right now. Please try again shortly or
              contact support.
            </Alert>
          ) : null}

          {error ? <Alert tone="danger">{error}</Alert> : null}

          <Button
            size="lg"
            fullWidth
            loading={busy}
            disabled={!priced || priced.price.total <= 0}
            onClick={pay}
          >
            {stage === "creating"
              ? "Creating booking…"
              : stage === "redirecting"
                ? isPartner
                  ? "Placing order…"
                  : "Opening checkout…"
                : priced
                  ? isPartner
                    ? `Place order · ${formatNaira(priced.price.total)}`
                    : `Pay ${formatNaira(priced.price.total)}`
                  : isPartner
                    ? "Place order"
                    : "Pay"}
          </Button>
          <Button variant="secondary" fullWidth onClick={goBack} disabled={busy}>
            Back to review
          </Button>

          <p className="text-center text-xs text-muted">
            {isPartner
              ? "Your order is confirmed straight away and added to your account balance. You can see everything on your account statement."
              : "Your booking is created first, then payment is verified on our servers before it's confirmed. You can retry payment from your dashboard if anything goes wrong."}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
