
import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Copies the receiver's public tracking link (with their delivery code) so the
 *  sender can forward it by WhatsApp, SMS, etc. if the receiver has no email on file. */
export function ShareTrackingLink({ trackingUrl }: { trackingUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const full = `${window.location.origin}${trackingUrl}`;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this tracking link for the receiver:", full);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={copy} title="Share with the receiver">
      {copied ? "Link copied!" : "Share with receiver"}
    </Button>
  );
}
