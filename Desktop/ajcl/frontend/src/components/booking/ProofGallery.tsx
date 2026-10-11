import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { fetchBlob } from "@/lib/http";
import { cn, formatDateTime } from "@/lib/utils";
import type { ProofDTO } from "@/types";

/** A protected proof photo. The file needs the login token, so it is fetched as a blob. */
function ProofImage({
  path,
  alt,
  className,
}: {
  path: string;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let made: string | null = null;
    setUrl(null);
    setFailed(false);
    fetchBlob(path)
      .then((blob) => {
        if (cancelled) return;
        made = URL.createObjectURL(blob);
        setUrl(made);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [path]);

  if (failed) {
    return (
      <div className={cn("grid place-items-center bg-surface-2 text-xs text-muted", className)}>
        Photo unavailable
      </div>
    );
  }
  if (!url) return <div className={cn("animate-pulse bg-surface-2", className)} />;
  return <img src={url} alt={alt} className={cn("object-cover", className)} />;
}

const km = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);

/**
 * Proof of pickup / delivery: the rider's photos and (for admins only) their exact GPS
 * position, with how far that was from the booked address.
 */
export function ProofGallery({
  reference,
  proofs,
  photoBase,
  showLocation,
  title = "Proof of handover",
}: {
  reference: string;
  proofs: ProofDTO[];
  /** "/api/admin/bookings" for admins, "/api/bookings" for the customer. */
  photoBase: string;
  showLocation: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState<{ path: string; label: string } | null>(null);
  if (proofs.length === 0) return null;
  const pathFor = (photoId: string) => `${photoBase}/${encodeURIComponent(reference)}/photos/${photoId}`;

  return (
    <Card>
      <CardHeader
        title={title}
        description={
          showLocation
            ? "Photos and the rider's exact position, captured when they confirmed each step."
            : "Photos the rider took when they collected and handed over the package."
        }
      />
      <CardBody className="space-y-6">
        {proofs.map((p) => {
          const label = p.stage === "pickup" ? "Pickup" : "Delivery";
          const loc = p.location;
          return (
            <section key={p.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold">{label} proof</p>
                <p className="text-xs text-muted">
                  {formatDateTime(p.takenAt)}
                  {p.riderName ? ` · ${p.riderName}` : ""}
                </p>
              </div>

              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {p.photoIds.map((id, i) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setOpen({ path: pathFor(id), label: `${label} photo ${i + 1}` })}
                      className="block w-full overflow-hidden rounded-xl border border-line transition hover:border-ink"
                      aria-label={`View ${label.toLowerCase()} photo ${i + 1}`}
                    >
                      <ProofImage
                        path={pathFor(id)}
                        alt={`${label} photo ${i + 1}`}
                        className="aspect-[4/3] w-full"
                      />
                    </button>
                  </li>
                ))}
              </ul>

              {showLocation && loc ? (
                <div
                  className={cn(
                    "rounded-xl border p-3 text-sm",
                    loc.flagged
                      ? "border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)]"
                      : "border-line bg-surface",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">Rider&apos;s position</p>
                    {loc.flagged ? (
                      <span className="rounded-full bg-[var(--color-warning)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper">
                        Check location
                      </span>
                    ) : loc.distanceFromTargetM !== undefined ? (
                      <span className="rounded-full bg-[var(--color-success-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-success)]">
                        At the address
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 font-mono text-sm font-semibold">
                    {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {loc.accuracyM !== undefined ? `GPS accuracy within ${loc.accuracyM} m` : "GPS accuracy unknown"}
                    {loc.distanceFromTargetM !== undefined
                      ? ` · ${km(loc.distanceFromTargetM)} from the ${p.stage === "pickup" ? "pickup" : "delivery"} address`
                      : " · booked address has no map coordinates to compare"}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-ink underline"
                  >
                    Open the exact position in Maps
                  </a>
                </div>
              ) : null}
            </section>
          );
        })}
      </CardBody>

      <Modal open={open !== null} onClose={() => setOpen(null)} title={open?.label} size="lg">
        {open ? <ProofImage path={open.path} alt={open.label} className="max-h-[65vh] w-full rounded-lg object-contain" /> : null}
      </Modal>
    </Card>
  );
}
