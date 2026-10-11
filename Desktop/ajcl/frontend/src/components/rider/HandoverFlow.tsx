import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert, Spinner } from "@/components/ui/Feedback";
import { CodeScanner } from "@/components/rider/CodeScanner";
import { useGeoFix, type GeoFix } from "@/hooks/useGeoFix";
import { http, HttpError } from "@/lib/http";
import { photoToJpegDataUrl } from "@/lib/image";
import { cn } from "@/lib/utils";

type Stage = "pickup" | "delivery";
const MAX_PHOTOS = 2;

const COPY: Record<Stage, { path: string; noun: string; photoHint: string }> = {
  pickup: {
    path: "pickup",
    noun: "pickup",
    photoHint: "Photograph the package as you collect it, with the pickup spot or the sender in view if you can.",
  },
  delivery: {
    path: "deliver",
    noun: "delivery",
    photoHint: "Photograph the package handed over, at the door or with the receiver in view if you can.",
  },
};

/**
 * Confirming a handover is two steps:
 *   1. the sender's / receiver's code (scanned or typed)
 *   2. proof: a photo, and the rider's exact GPS position
 * The booking only moves on once both are done. Location starts being captured as
 * soon as this opens, so it's ready by the time the code is accepted.
 */
export function HandoverFlow({
  reference,
  stage,
  onDone,
}: {
  reference: string;
  stage: Stage;
  onDone: () => void;
}) {
  const copy = COPY[stage];
  const geo = useGeoFix();
  const [step, setStep] = useState<"code" | "proof">("code");
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  async function verify(code: string) {
    setVerifying(true);
    setCodeError(null);
    try {
      const res = await http.post<{ proofToken: string }>(
        `/api/rider/jobs/${encodeURIComponent(reference)}/${copy.path}/verify`,
        { code },
      );
      setToken(res.proofToken);
      setStep("proof");
    } catch (err) {
      setCodeError(err instanceof HttpError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-5">
      <ol className="flex items-center gap-2 text-xs font-semibold">
        {[
          { n: 1, label: "Code", active: step === "code", done: step === "proof" },
          { n: 2, label: "Photo & location", active: step === "proof", done: false },
        ].map((s, i) => (
          <li key={s.n} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                s.done ? "bg-[var(--color-success)] text-paper" : s.active ? "bg-ink text-paper" : "bg-surface-2 text-muted",
              )}
            >
              {s.done ? "✓" : s.n}
            </span>
            <span className={s.active || s.done ? "text-ink" : "text-muted"}>{s.label}</span>
            {i === 0 ? <span className="h-px flex-1 bg-line" /> : null}
          </li>
        ))}
      </ol>

      {step === "code" ? (
        <CodeScanner
          onSubmit={verify}
          submitting={verifying}
          submitLabel="Check code"
          error={codeError}
        />
      ) : (
        <ProofStep
          reference={reference}
          stage={stage}
          token={token}
          geo={geo}
          onDone={onDone}
          onExpired={() => {
            setToken("");
            setStep("code");
            setCodeError("Your code check expired. Enter the code again.");
          }}
        />
      )}
    </div>
  );
}

function ProofStep({
  reference,
  stage,
  token,
  geo,
  onDone,
  onExpired,
}: {
  reference: string;
  stage: Stage;
  token: string;
  geo: ReturnType<typeof useGeoFix>;
  onDone: () => void;
  onExpired: () => void;
}) {
  const copy = COPY[stage];
  const input = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fix: GeoFix | null = geo.state.status === "ready" ? geo.state.fix : null;
  const canSubmit = photos.length > 0 && Boolean(fix) && !processing && !submitting;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same photo be chosen again
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      const dataUrl = await photoToJpegDataUrl(file);
      setPhotos((p) => [...p, dataUrl].slice(0, MAX_PHOTOS));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't use that photo. Take another.");
    } finally {
      setProcessing(false);
    }
  }

  async function confirm() {
    setSubmitting(true);
    setError(null);
    try {
      // Re-check the position right now if it's getting old (the rider may have walked).
      const f = await geo.ensureFresh(90_000);
      await http.post(`/api/rider/jobs/${encodeURIComponent(reference)}/${copy.path}`, {
        proofToken: token,
        photos,
        location: {
          lat: f.lat,
          lng: f.lng,
          accuracyM: f.accuracyM,
          ageMs: Math.max(0, Date.now() - f.at),
        },
      });
      onDone();
    } catch (err) {
      if (err instanceof HttpError && err.status === 403 && /expired/i.test(err.message)) {
        onExpired();
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <Alert tone="success">Code accepted. Now add a photo and confirm your location.</Alert>
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {/* Location */}
      <div className="rounded-xl border border-line p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Your location</p>
        {geo.state.status === "error" ? (
          <div className="mt-2 space-y-3">
            <p className="text-sm text-[var(--color-danger)]">{geo.state.message}</p>
            <Button variant="secondary" size="sm" onClick={() => void geo.capture().catch(() => undefined)}>
              Try again
            </Button>
          </div>
        ) : !fix ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
            <Spinner className="size-4" /> Getting your exact location…
          </p>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span
                  className={cn(
                    "size-2.5 rounded-full",
                    fix.accuracyM <= 100 ? "bg-[var(--color-success)]" : "bg-[var(--color-warning)]",
                  )}
                />
                {geo.state.status === "ready" && fix.accuracyM <= 30
                  ? "Location locked"
                  : fix.accuracyM <= 100
                    ? "Location found"
                    : "Weak GPS signal"}
                <span className="font-normal text-muted">within {fix.accuracyM} m</span>
              </p>
              {fix.accuracyM > 100 ? (
                <p className="mt-1 text-xs text-[var(--color-warning)]">
                  Step outside or near a window for a better fix. You can still confirm.
                </p>
              ) : null}
            </div>
            <Button variant="ghost" size="sm" onClick={() => void geo.capture().catch(() => undefined)}>
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Photos */}
      <div className="rounded-xl border border-line p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Proof photo</p>
        <p className="mt-1 text-sm text-ink-soft">{copy.photoHint}</p>

        <input
          ref={input}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPick}
          className="hidden"
        />

        {photos.length > 0 ? (
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {photos.map((src, i) => (
              <li key={i} className="relative overflow-hidden rounded-xl border border-line bg-surface">
                <img src={src} alt={`Proof photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                <button
                  type="button"
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-ink/70 text-sm text-paper hover:bg-ink"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {photos.length < MAX_PHOTOS ? (
          <Button
            variant={photos.length === 0 ? "primary" : "secondary"}
            size="sm"
            className="mt-3"
            loading={processing}
            onClick={() => input.current?.click()}
          >
            {photos.length === 0 ? "Take photo" : "Add another photo"}
          </Button>
        ) : null}
      </div>

      <Button fullWidth size="lg" loading={submitting} disabled={!canSubmit} onClick={confirm}>
        Confirm {copy.noun}
      </Button>
      {!canSubmit && !submitting ? (
        <p className="-mt-2 text-center text-xs text-muted">
          {photos.length === 0 && !fix
            ? "Add a photo and wait for your location to continue."
            : photos.length === 0
              ? "Add a photo to continue."
              : !fix
                ? "Waiting for your location…"
                : ""}
        </p>
      ) : null}
    </div>
  );
}
