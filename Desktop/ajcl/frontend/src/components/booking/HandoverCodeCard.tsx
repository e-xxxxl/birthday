
import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { QRCodeDisplay } from "@/components/ui/QRCode";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";

/** Shows a 6-digit handover code + QR, with a "used" state once the rider has verified it.
 *  Used for both the sender's pickup code and the receiver's delivery code. */
export function HandoverCodeCard({
  title,
  description,
  code,
  usedAt,
  locked,
  tone = "amber",
}: {
  title: string;
  description: string;
  code?: string;
  usedAt?: string;
  locked?: boolean;
  tone?: "amber" | "navy";
}) {
  const [copied, setCopied] = useState(false);

  if (usedAt) {
    return (
      <Card className="border-[var(--color-success)]/30">
        <CardHeader title={title} description={description} />
        <CardBody className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-success-soft)] text-lg text-[var(--color-success)]">
            ✓
          </span>
          <div>
            <p className="text-sm font-bold text-[var(--color-success)]">Verified</p>
            <p className="text-xs text-muted">Confirmed {formatDateTime(usedAt)}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!code) {
    return (
      <Card>
        <CardHeader title={title} description={description} />
        <CardBody>
          <p className="text-sm text-muted">Your code will appear here once it&apos;s generated.</p>
        </CardBody>
      </Card>
    );
  }

  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — the digits are already visible to copy by hand */
    }
  }

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-4">
        {locked ? (
          <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-danger)]">
            This code was locked after too many incorrect attempts. Contact support to reset it.
          </div>
        ) : null}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <QRCodeDisplay value={code} size={148} />
          <div className="flex-1 text-center sm:text-left">
            <p
              className={
                "font-mono text-3xl font-bold tracking-[0.15em] " +
                (tone === "navy" ? "text-navy" : "text-ink")
              }
            >
              {spaced}
            </p>
            <p className="mt-2 text-xs text-muted">
              Show this QR to the rider, or read out the digits — either works.
            </p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={copyCode}>
              {copied ? "Copied!" : "Copy code"}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
