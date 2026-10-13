import { useState } from "react";
import { Alert } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { http, HttpError } from "@/lib/http";
import { formatNaira } from "@/lib/utils";
import { site } from "@/config/site";
import { useAuth } from "@/components/providers/AuthProvider";
import { isFundedPayment } from "@/config/booking";
import type { BookingDTO } from "@/types";

const WhatsAppIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.1.1.3 0 .5l-.4.5-.3.3c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.3.1.2.1.7-.1 1.3Z" />
  </svg>
);

export function BookingActions({ booking }: { booking: BookingDTO }) {
  const { user } = useAuth();
  const isPartner = Boolean(user?.partner);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const terminal =
    booking.status === "delivered" || booking.status === "cancelled" || booking.status === "returned";
  const needsPayment =
    !isFundedPayment(booking.payment.status) &&
    booking.status !== "cancelled" &&
    booking.status !== "returned";

  async function retryPayment() {
    setPaying(true);
    setError(null);
    try {
      if (isPartner) {
        await http.post(`/api/bookings/${encodeURIComponent(booking.bookingReference)}/place-on-account`);
        window.location.reload();
        return;
      }
      const init = await http.post<{ authorizationUrl: string }>("/api/payments/initialize", {
        bookingReference: booking.bookingReference,
      });
      window.location.href = init.authorizationUrl;
    } catch (err) {
      setPaying(false);
      setError(err instanceof HttpError ? err.message : isPartner ? "Could not place the order." : "Could not start payment.");
    }
  }

  // Nothing actionable / to say once a booking is delivered or cancelled.
  if (terminal && !needsPayment) return null;

  const whatsappHref = `${site.contact.whatsappHref}?text=${encodeURIComponent(
    `Hi AJ Courier & Logistics, I need help with my booking ${booking.bookingReference}.`,
  )}`;

  return (
    <div className="rounded-2xl border border-line bg-paper p-4 shadow-card">
      {error ? (
        <Alert tone="danger" className="mb-3">
          {error}
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {needsPayment
            ? isPartner
              ? `Place this order of ${formatNaira(booking.pricing.total)} on your account to confirm it.`
              : `Complete payment of ${formatNaira(booking.pricing.total)} to confirm this booking.`
            : booking.payment.status === "on_account"
              ? "This order is billed to your partner account. Need to change or cancel it? Our team will sort it out on WhatsApp."
              : "Need to change or cancel this delivery? Our team will sort it out on WhatsApp."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            variant="secondary"
            size="sm"
          >
            <WhatsAppIcon />
            Chat with support
          </Button>
          {needsPayment ? (
            <Button size="sm" loading={paying} onClick={retryPayment}>
              Pay {formatNaira(booking.pricing.total)}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
