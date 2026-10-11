
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { cn } from "@/lib/utils";

/**
 * Confirms a pickup/delivery by QR scan or manual 6-digit entry — both paths
 * call the same `onSubmit`. The camera is opt-in (tap "Scan QR code") so the
 * page never prompts for camera access just by being opened, and manual entry
 * always works even if the camera is denied, missing, or the screen is cracked.
 */
export function CodeScanner({
  onSubmit,
  submitting,
  submitLabel,
  error,
}: {
  onSubmit: (code: string) => void;
  submitting: boolean;
  submitLabel: string;
  error?: string | null;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);

  const code = digits.join("");
  const complete = code.length === 6;

  function setDigit(i: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((d) => {
      const next = [...d];
      next[i] = clean;
      return next;
    });
    if (clean && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    setDigits((d) => {
      const next = [...d];
      for (let i = 0; i < 6; i += 1) next[i] = text[i] ?? next[i];
      return next;
    });
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  }

  function fillFromScan(value: string) {
    const clean = value.replace(/\D/g, "").slice(0, 6);
    if (clean.length !== 6) return; // not a code we recognise — ignore the scan
    setDigits(clean.split(""));
    setScannerOpen(false);
  }

  function submit() {
    if (!complete || submitting) return;
    onSubmit(code);
  }

  return (
    <div className="space-y-4">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {scannerOpen ? (
        <QrScanner onDetected={fillFromScan} onClose={() => setScannerOpen(false)} />
      ) : (
        <Button variant="secondary" fullWidth onClick={() => setScannerOpen(true)}>
          Scan QR code
        </Button>
      )}

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-line" />
        or enter the 6-digit code
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="flex justify-center gap-2" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onFocus={(e) => e.currentTarget.select()}
            className="size-11 rounded-xl border border-line-strong text-center text-lg font-bold outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 sm:size-12"
          />
        ))}
      </div>

      <Button fullWidth size="lg" loading={submitting} disabled={!complete} onClick={submit}>
        {submitLabel}
      </Button>
    </div>
  );
}

/** Lower-level camera scanner using html5-qrcode, loaded only while open. */
function QrScanner({ onDetected, onClose }: { onDetected: (value: string) => void; onClose: () => void }) {
  const containerId = useRef(`qr-scanner-${Math.random().toString(36).slice(2)}`);
  const [status, setStatus] = useState<"starting" | "running" | "error">("starting");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        scanner = new Html5Qrcode(containerId.current, { verbose: false });
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            onDetected(decodedText);
          },
          () => {
            /* per-frame "no QR found" — expected constantly, ignore */
          },
        );
        if (cancelled) {
          await scanner.stop().catch(() => {});
          return;
        }
        setStatus("running");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          err instanceof Error && /permission|denied|NotAllowed/i.test(err.message)
            ? "Camera access was denied. Allow camera access, or use the code fields below."
            : "Couldn't start the camera. Use the code fields below instead.",
        );
      }
    })();

    return () => {
      cancelled = true;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner?.clear())
          .catch(() => {
            try {
              scanner?.clear();
            } catch {
              /* already torn down */
            }
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink">
      <div className="flex items-center justify-between bg-ink px-4 py-2.5">
        <span className="text-xs font-semibold text-paper/80">
          {status === "running" ? "Point the camera at the QR code" : "Starting camera…"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-paper/10 px-2.5 py-1 text-xs font-semibold text-paper hover:bg-paper/20"
        >
          Close
        </button>
      </div>
      {status === "error" ? (
        <div className="p-4">
          <Alert tone="warning">{message}</Alert>
        </div>
      ) : (
        <div id={containerId.current} className={cn("w-full", status === "starting" && "min-h-52")} />
      )}
    </div>
  );
}
