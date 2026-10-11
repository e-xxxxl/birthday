
import { useCallback, useEffect, useState } from "react";
import { site } from "@/config/site";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "ajc:pwa-install-dismissed-at";
const INSTALLED_KEY = "ajc:pwa-installed";
const SNOOZE_DAYS = 14;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function snoozed(): boolean {
  try {
    if (localStorage.getItem(INSTALLED_KEY)) return true;
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at > 0 && Date.now() - at < SNOOZE_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function detectIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome/.test(ua);
  return iOS && isSafari;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [busy, setBusy] = useState(false);

  const close = useCallback((remember: boolean) => {
    setVisible(false);
    if (remember) {
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (isStandalone() || snoozed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      // Small delay so it doesn't fight the first paint. Re-check snooze at
      // fire time in case the user dismissed it earlier this session.
      window.setTimeout(() => {
        if (!snoozed() && !isStandalone()) setVisible(true);
      }, 2500);
    };

    const onInstalled = () => {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {
        /* ignore */
      }
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt — offer the manual hint instead.
    if (detectIos()) {
      const t = window.setTimeout(() => {
        if (snoozed() || isStandalone()) return;
        setIosHint(true);
        setVisible(true);
      }, 4000);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
        window.removeEventListener("appinstalled", onInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
      } else {
        close(true);
      }
    } catch {
      close(true);
    } finally {
      setBusy(false);
      setDeferred(null);
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install app"
      className="fixed inset-x-0 bottom-0 z-[95] flex justify-center p-3 sm:p-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
    >
      <div className="animate-fade-in-up w-full max-w-md overflow-hidden rounded-2xl bg-ink text-paper shadow-pop">
        <div className="flex items-start gap-3 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-paper p-1.5">
            <img src="/logo.png" alt="" className="h-full w-full object-contain" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Install the {site.shortName} app</p>
            {iosHint ? (
              <p className="mt-0.5 text-xs text-paper/70">
                Tap the Share icon{" "}
                <span aria-hidden className="mx-0.5 inline-block align-middle">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="inline">
                    <path
                      d="M12 3v13M12 3 8 7M12 3l4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>{" "}
                then <strong>Add to Home Screen</strong>.
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-paper/70">
                Get faster access and book on the go. It won&apos;t take up space on your device.
              </p>
            )}

            <div className="mt-3 flex items-center gap-2">
              {!iosHint ? (
                <button
                  type="button"
                  onClick={install}
                  disabled={busy}
                  className="inline-flex h-9 items-center rounded-full bg-paper px-4 text-xs font-bold text-ink transition hover:bg-white/90 disabled:opacity-60"
                >
                  {busy ? "Opening…" : "Install now"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => close(true)}
                className="inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-paper/70 transition hover:text-paper"
              >
                Not now
              </button>
            </div>
          </div>

          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => close(true)}
            className="-m-1 rounded p-1 text-paper/60 transition hover:text-paper"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
