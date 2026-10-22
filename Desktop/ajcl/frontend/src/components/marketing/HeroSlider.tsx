import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Wave } from "@/components/marketing/Wave";
import { apiUrl } from "@/lib/http";
import { cn } from "@/lib/utils";
import { photo, SLIDE_INSET, SLIDE_PHOTO, type MediaKey } from "@/config/media";
import type { Slide } from "@/types/shipping";

/** Shown at once, before (or without) the editable copy from the server. */
export const DEFAULT_SLIDES: Slide[] = [
  { key: "local", title: "Same-day delivery, door to door.", subtitle: "Book a rider in minutes, pay securely and follow your package live from pickup to drop-off.", ctaLabel: "Send a package", href: "/send", imageUrl: null },
  { key: "international", title: "Ship worldwide with confidence.", subtitle: "Documents and parcels to destinations worldwide. Get a live quote before you commit to anything.", ctaLabel: "Get a quote", href: "/quote", imageUrl: null },
  { key: "air", title: "Air cargo, when time matters.", subtitle: "Move heavier consignments by air with clear handling and dependable timelines.", ctaLabel: "Learn more", href: "/air-cargo", imageUrl: null },
  { key: "sea", title: "Sea freight for the big loads.", subtitle: "The economical way to move large volumes overseas. See our latest flier.", ctaLabel: "View flier", href: "#sea-flier", imageUrl: null },
  { key: "express", title: "AJCL Express", subtitle: "Prices change every month. See this month's price list.", ctaLabel: "See current prices", href: "/express", imageUrl: null },
];

/** The small card that floats on the picture. */
const BADGE: Record<Slide["key"], { icon: IconName; title: string; text: string }> = {
  local: { icon: "pin", title: "Live tracking", text: "Follow your rider on the map" },
  international: { icon: "globe", title: "Live carrier rates", text: "Priced before you pay" },
  air: { icon: "plane", title: "Air freight", text: "For urgent, heavy cargo" },
  sea: { icon: "ship", title: "Sea freight", text: "Lower cost for large volumes" },
  express: { icon: "tag", title: "Monthly price list", text: "Download the latest PDF" },
};

const AUTOPLAY_MS = 7000;
const SWIPE_PX = 48;

/**
 * The homepage hero. Navy background, a headline and one clear action on the left, and a photograph in a
 * leaf-shaped frame on the right with a round inset photo and a small floating card. It autoplays (and pauses on
 * hover or focus), responds to swipe and arrow keys, and is announced as a carousel.
 */
export function HeroSlider({ slides, onOpenFlier }: { slides: Slide[]; onOpenFlier: () => void }) {
  const list = slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const idx = index % list.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mq.removeEventListener("change", onChange);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const playing = !paused && !hidden && !reduced && list.length > 1;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setIndex((n) => n + 1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [playing, index]);

  const go = useCallback((n: number) => setIndex((n + list.length) % list.length), [list.length]);
  const main = (s: Slide) => (s.imageUrl ? apiUrl(s.imageUrl) : photo((SLIDE_PHOTO[s.key] ?? "scooter") as MediaKey, 1400));
  const inset = (s: Slide) => photo((SLIDE_INSET[s.key] ?? "truck") as MediaKey, 500);

  return (
    <section
      className="relative overflow-hidden bg-ink text-white"
      aria-roledescription="carousel"
      aria-label="Our services"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(idx - 1);
        if (e.key === "ArrowRight") go(idx + 1);
      }}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) go(idx + (dx < 0 ? 1 : -1));
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "22px 22px" }}
      />
      {/* A sweep of sky blue behind the picture */}
      <span aria-hidden className="absolute -right-32 -top-32 size-72 rounded-full bg-sky/20 md:-right-40 md:-top-40 md:size-[34rem]" />

      <div className="container-page relative grid items-center gap-12 pb-28 pt-12 md:pb-36 md:pt-14 lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]" aria-live={playing ? "off" : "polite"}>
        {/* Words */}
        <div>
          <div className="grid">
            {list.map((s, n) => {
              const active = n === idx;
              const Heading = n === 0 ? "h1" : "h2";
              return (
                <div
                  key={s.key}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${n + 1} of ${list.length}`}
                  aria-hidden={!active}
                  // `inert` keeps hidden slides out of the tab order.
                  {...(!active ? { inert: true as unknown as undefined } : {})}
                  className={cn(
                    "col-start-1 row-start-1 transition-all duration-700 ease-[var(--ease-out-soft)]",
                    active ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-6 opacity-0",
                  )}
                >
                  <Heading className="max-w-xl text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-[3.6rem]">{s.title}</Heading>
                  <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">{s.subtitle}</p>
                  <div className="mt-8">
                    {s.href === "#sea-flier" ? (
                      <Button size="lg" arrow onClick={onOpenFlier}>
                        {s.ctaLabel}
                      </Button>
                    ) : (
                      <Button href={s.href} size="lg" arrow>
                        {s.ctaLabel}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {list.length > 1 ? (
            <div className="mt-10 flex items-center gap-6">
              <div className="flex items-center gap-2" role="group" aria-label="Choose a slide">
                {list.map((s, n) => (
                  <button
                    key={s.key}
                    type="button"
                    aria-label={`Show slide ${n + 1}: ${s.title}`}
                    aria-current={n === idx}
                    onClick={() => go(n)}
                    className={cn("h-2.5 rounded-full transition-all duration-300", n === idx ? "w-9 bg-accent" : "w-2.5 bg-white/35 hover:bg-white/70")}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" aria-label="Previous slide" onClick={() => go(idx - 1)} className="grid size-11 place-items-center rounded-full border border-white/30 text-white transition-colors hover:bg-white hover:text-ink">
                  <Icon name="arrow-left" className="size-5" />
                </button>
                <button type="button" aria-label="Next slide" onClick={() => go(idx + 1)} className="grid size-11 place-items-center rounded-full border border-white/30 text-white transition-colors hover:bg-white hover:text-ink">
                  <Icon name="arrow" className="size-5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Picture */}
        <div className="grid">
          {list.map((s, n) => {
            const active = n === idx;
            const b = BADGE[s.key];
            return (
              <div
                key={s.key}
                aria-hidden
                className={cn(
                  "relative col-start-1 row-start-1 mx-auto w-full max-w-xl pb-8 pl-4 transition-all duration-700 ease-[var(--ease-out-soft)] lg:max-w-none",
                  active ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0",
                )}
              >
                <span className="absolute inset-y-4 -right-2 left-8 rounded-bl-3xl rounded-br-[7rem] rounded-tl-[7rem] rounded-tr-3xl bg-accent" />
                <img
                  src={main(s)}
                  alt=""
                  loading={n === 0 ? "eager" : "lazy"}
                  fetchPriority={n === 0 ? "high" : "auto"}
                  className="relative aspect-[5/4] w-full rounded-bl-3xl rounded-br-[7rem] rounded-tl-[7rem] rounded-tr-3xl object-cover shadow-pop"
                />
                <img
                  src={inset(s)}
                  alt=""
                  loading="lazy"
                  className="absolute -left-2 bottom-0 size-28 rounded-full border-[6px] border-ink object-cover ring-4 ring-accent md:size-40"
                />
                <div className="absolute right-3 top-6 flex items-center gap-3 rounded-2xl bg-paper p-3 pr-5 text-ink shadow-pop md:right-8">
                  <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent-dark">
                    <Icon name={b.icon} className="size-6" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-bold">{b.title}</span>
                    <span className="block text-xs text-muted">{b.text}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Wave />
    </section>
  );
}
