import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "up" | "left" | "right" | "zoom";

/** True once the element has been on screen. Observes once, then stops. */
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen] as const;
}

/** Fades and slides its content in the first time it scrolls into view. */
export function Reveal({
  as,
  variant = "up",
  delay = 0,
  className,
  style,
  children,
}: {
  as?: ElementType;
  variant?: Variant;
  /** Milliseconds to wait, to stagger neighbours. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const Tag = (as ?? "div") as ElementType;
  const [ref, seen] = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      data-v={variant}
      className={cn("reveal", seen && "is-in", className)}
      style={{ ...style, transitionDelay: seen && delay ? `${delay}ms` : undefined }}
    >
      {children}
    </Tag>
  );
}

/**
 * A framed photograph. It fades in, settles from slightly enlarged, and drifts a little against the
 * scroll, so the image feels set into the page rather than stuck on it.
 */
export function RevealImage({
  src,
  alt = "",
  className,
  imgClassName,
  variant = "up",
  delay = 0,
  parallax = 28,
  priority,
}: {
  src: string;
  alt?: string;
  /** Classes for the frame: size, radius, borders. */
  className?: string;
  imgClassName?: string;
  variant?: Variant;
  delay?: number;
  /** How many pixels the picture may drift. 0 turns it off. */
  parallax?: number;
  priority?: boolean;
}) {
  const [ref, seen] = useInView<HTMLDivElement>(0.1);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!parallax || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const frame = ref.current;
    const el = img.current;
    if (!frame || !el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = frame.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -50 || r.top > vh + 50) return;
      // -1 when the frame is entering at the bottom, +1 when leaving at the top
      const p = ((r.top + r.height / 2) / vh - 0.5) * 2;
      el.style.translate = `0 ${Math.max(-1, Math.min(1, p)) * -parallax * 0.5}px`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [parallax, ref]);

  return (
    <div
      ref={ref}
      data-v={variant}
      className={cn("reveal reveal-img relative", seen && "is-in", className)}
      style={{ transitionDelay: seen && delay ? `${delay}ms` : undefined }}
    >
      <img
        ref={img}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={cn("h-full w-full object-cover", imgClassName)}
        style={parallax ? { scale: "1.08" } : undefined}
      />
    </div>
  );
}
