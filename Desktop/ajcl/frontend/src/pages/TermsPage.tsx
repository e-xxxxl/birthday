import { LegalPage } from "@/components/marketing/LegalPage";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { site } from "@/config/site";

export function TermsPage() {
  useDocumentTitle("Terms & Conditions");
  return (
    <LegalPage title="Terms & Conditions" updated="August 2026">
      <p>
        By creating an account or booking a delivery with {site.name}, you agree to these terms.
        Please read them carefully.
      </p>

      <h2>The service</h2>
      <p>
        {site.name} arranges courier and delivery services between the locations you specify. The
        full fare for your delivery is shown before you pay and is confirmed on our servers at
        checkout.
      </p>

      <h2>Bookings &amp; payment</h2>
      <ul>
        <li>A booking is only confirmed once payment has been verified with our payment processor.</li>
        <li>The price shown before payment is recalculated on our servers; the verified amount is final.</li>
        <li>You are responsible for the accuracy of the addresses, contacts and package information you provide.</li>
      </ul>

      <h2>Prohibited items</h2>
      <p>
        You may not ship illegal goods, hazardous materials, weapons, live animals, or perishable
        items that are not adequately packaged. We may refuse or cancel any booking that breaches
        this clause.
      </p>

      <h2>Cancellations &amp; refunds</h2>
      <p>
        You may cancel a booking that is still pending or confirmed from your dashboard. Refund
        eligibility depends on how far the delivery has progressed and is handled case by case.
        Contact support for assistance.
      </p>

      <h2>Liability</h2>
      <p>
        Declared package value is used for reference only and does not constitute insurance. Our
        liability for loss or damage is limited to the delivery fee paid, except where a higher
        amount is required by law.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. Continued use of the platform after a change
        means you accept the revised terms.
      </p>

      <h2>Contact</h2>
      <p>
        For anything relating to these terms, email {site.contact.email} or call {site.contact.phone}.
      </p>
    </LegalPage>
  );
}
