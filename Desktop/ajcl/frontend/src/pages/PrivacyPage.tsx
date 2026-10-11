import { LegalPage } from "@/components/marketing/LegalPage";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { site } from "@/config/site";

export function PrivacyPage() {
  useDocumentTitle("Privacy Policy");
  return (
    <LegalPage title="Privacy Policy" updated="August 2026">
      <p>
        This policy explains what personal information {site.name} collects when you use this
        platform to book a delivery, and how we use and protect it.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account details: your name, email address and phone number.</li>
        <li>Booking details: pickup, stop and destination addresses, sender and recipient contacts, and package descriptions you provide.</li>
        <li>Payment metadata: the transaction reference, amount, status and channel returned by our payment processor. We never store your card details.</li>
        <li>Technical data: basic request logs used to keep the service secure and reliable.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To calculate routes and fares, create and fulfil your bookings, and keep you updated on delivery status.</li>
        <li>To verify payments with our payment processor before a booking is confirmed.</li>
        <li>To respond to support requests and prevent fraud or abuse.</li>
      </ul>

      <h2>Third parties</h2>
      <p>
        We share the minimum necessary data with Google Maps Platform (to resolve addresses and
        compute routes) and Paystack (to process payments). These providers process data under their
        own terms. We do not sell your personal information.
      </p>

      <h2>Data retention &amp; your rights</h2>
      <p>
        We keep booking records for as long as needed to provide the service and meet legal
        obligations. You can request access to, correction of, or deletion of your personal data by
        contacting us at{" "}
        <a href={`mailto:${site.contact.email}`} className="font-semibold text-ink underline">
          {site.contact.email}
        </a>
        .
      </p>

      <h2>Security</h2>
      <p>
        Passwords are hashed, sessions use signed bearer tokens, and payment verification is
        performed server-side. No method of transmission is completely secure, but we work to protect
        your information using industry-standard measures.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email {site.contact.email} or call {site.contact.phone}.
      </p>
    </LegalPage>
  );
}
