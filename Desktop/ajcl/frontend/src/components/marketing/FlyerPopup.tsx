import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AppLink } from "@/components/ui/AppLink";
import { apiUrl } from "@/lib/http";
import { cn } from "@/lib/utils";
import type { PopupFlyer } from "@/types/shipping";

const SEEN_KEY = "ajcl-flyers-seen";

function readSeen(): string[] {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeSeen(ids: string[]) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    /* private mode: the pop-up may show again, which is harmless */
  }
}

/**
 * The Super Admin's pop-up flyers, shown once per visit over the landing page. They are usually portrait
 * posters, so the picture is fitted to the screen height and never cropped.
 */
export function FlyerPopup({ flyers }: { flyers: PopupFlyer[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // A flyer the visitor has already closed this visit is not shown again until they come back later.
  const unseen = flyers.filter((f) => !readSeen().includes(f.id));
  const key = unseen.map((f) => f.id).join(",");

  useEffect(() => {
    if (!key) {
      setOpen(false);
      return;
    }
    setIndex(0);
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [key]);

  const close = useCallback(() => {
    writeSeen([...new Set([...readSeen(), ...unseen.map((f) => f.id)])]);
    setOpen(false);
  }, [unseen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  if (!open || unseen.length === 0 || typeof document === "undefined") return null;
  const flyer = unseen[Math.min(index, unseen.length - 1)];
  const external = flyer.linkUrl ? /^https?:\/\//i.test(flyer.linkUrl) : false;

  const picture = (
    <img
      src={apiUrl(flyer.imageUrl)}
      alt={flyer.title || "Announcement"}
      className="block max-h-[80vh] w-auto max-w-[min(92vw,28rem)] rounded-3xl bg-paper object-contain shadow-pop"
      draggable={false}
    />
  );

  return createPortal(
    <div className="fixed inset-0 z-[95] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={flyer.title || "Announcement"}>
      <button aria-label="Close announcement" className="absolute inset-0 animate-fade-in bg-navy-deep/70" onClick={close} />
      <div className="relative animate-fade-in-up">
        {flyer.linkUrl ? (
          external ? (
            <a href={flyer.linkUrl} target="_blank" rel="noreferrer noopener" onClick={close}>
              {picture}
            </a>
          ) : (
            <AppLink href={flyer.linkUrl} onClick={close}>
              {picture}
            </AppLink>
          )
        ) : (
          picture
        )}

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute -right-2 -top-2 grid size-11 place-items-center rounded-full bg-paper text-ink shadow-pop transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky sm:-right-4 sm:-top-4"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {unseen.length > 1 ? (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + unseen.length) % unseen.length)}
              aria-label="Previous announcement"
              className="grid size-9 place-items-center rounded-full bg-white/90 text-ink hover:bg-white"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <div className="flex gap-2">
              {unseen.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  aria-label={`Show announcement ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={cn("h-2.5 rounded-full transition-all", i === index ? "w-6 bg-accent" : "w-2.5 bg-white/70 hover:bg-white")}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % unseen.length)}
              aria-label="Next announcement"
              className="grid size-9 place-items-center rounded-full bg-white/90 text-ink hover:bg-white"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
