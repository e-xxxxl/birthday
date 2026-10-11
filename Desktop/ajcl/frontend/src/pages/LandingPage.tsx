import { useEffect, useState } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Feedback";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import { cn } from "@/lib/utils";
import { vehicleImage } from "@/lib/vehicle-media";
import { site } from "@/config/site";
import type { VehicleDTO } from "@/types";

export function LandingPage() {
  useDocumentTitle(`${site.tagline}`);
  const { data, loading } = useAsync(
    () => http.get<{ vehicles: VehicleDTO[] }>("/api/vehicles"),
    [],
  );
  const vehicles = data?.vehicles ?? [];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="container-page relative grid gap-12 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Looking for a reliable delivery service?
            </h1>
            <p className="mt-5 max-w-md text-lg text-paper/70">
              Book a rider in minutes. Live route tracking from pickup to drop-off, and the full fare
              shown upfront before you pay.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/book" variant="accent" size="lg">
                Get a Rider
              </Button>
              <Button
                href="/#how-it-works"
                size="lg"
                className="border border-paper/25 bg-transparent text-paper hover:bg-paper/10"
              >
                How it works
              </Button>
            </div>
            <dl className="mt-12 grid max-w-sm grid-cols-3 gap-6">
              {[
                ["3", "Vehicle classes"],
                ["24/7", "Booking"],
                ["Live", "Tracking"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-2xl font-bold">{value}</dt>
                  <dd className="text-xs text-paper/60">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative animate-fade-in">
            <HeroVehicles vehicles={vehicles} />
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────── */}
      <section id="services" className="container-page py-20">
        <SectionHeading
          eyebrow="Our fleet"
          title="Pick the vehicle that fits the load"
          description="Bikes, mini vans and mini trucks. You see the full fare for your delivery before you pay — no surprises."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {loading && vehicles.length === 0
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-2xl" />)
            : vehicles.map((v) => (
                <div
                  key={v.slug}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-card transition hover:-translate-y-1 hover:border-ink"
                >
                  <div className="aspect-[5/4] border-b border-line bg-surface">
                    <img
                      src={vehicleImage(v.slug)}
                      alt={v.name}
                      loading="lazy"
                      className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold">{v.name}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted">{v.description}</p>
                    <div className="mt-5 border-t border-line pt-4 text-sm">
                      <span className="font-semibold text-ink-soft">{v.capacity}</span>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how-it-works" className="bg-surface py-20">
        <div className="container-page">
          <SectionHeading eyebrow="How it works" title="From booking to doorstep in four steps" />
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              {
                t: "Set your route",
                d: "Enter pickup, any stops and the destination. Addresses autocomplete as you type.",
              },
              {
                t: "Get a price",
                d: "We show the full fare for each vehicle. The price you see is the price you pay.",
              },
              {
                t: "Pay securely",
                d: "Confirm the booking and pay with Paystack. Payment is verified before dispatch.",
              },
              {
                t: "Track delivery",
                d: "Follow the status timeline from driver assigned through to delivered.",
              },
            ].map((step, i) => (
              <li key={step.t} className="relative rounded-2xl border border-line bg-paper p-6">
                <span className="grid size-9 place-items-center rounded-full bg-ink text-sm font-bold text-paper">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-base font-bold">{step.t}</h3>
                <p className="mt-2 text-sm text-muted">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section id="pricing" className="container-page py-20">
        <div className="grid gap-10 rounded-3xl border border-line bg-paper p-8 shadow-card md:grid-cols-2 md:p-12">
          <div>
            <SectionHeading
              eyebrow="Upfront pricing"
              title="One clear price — nothing hidden"
              align="left"
            />
            <p className="mt-4 text-sm text-muted">
              You see the <strong className="text-ink">full fare</strong> for your delivery before you
              pay. Return deliveries include the trip back to pickup. The amount is confirmed on our
              servers at checkout, so the price never changes on you.
            </p>
            <Button href="/book" className="mt-6" variant="primary">
              Start a booking
            </Button>
          </div>
          <div className="space-y-3">
            {[
              ["Single delivery", "Pickup → stops → destination"],
              ["Return delivery", "Pickup → destination → back to pickup"],
              ["Multiple stops", "Add up to 5 stops on one route"],
              ["Scheduled", "Pick the date and time that suits you"],
            ].map(([t, d]) => (
              <div key={t} className="flex gap-3 rounded-xl bg-surface p-4">
                <span aria-hidden className="mt-0.5 text-accent">
                  ✦
                </span>
                <div>
                  <p className="text-sm font-bold">{t}</p>
                  <p className="text-sm text-muted">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ────────────────────────────────────────── */}
      <section className="bg-ink text-paper">
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Fast, reliable &amp; dependable deliveries</h2>
          <p className="max-w-lg text-paper/70">
            Join the customers who dispatch with {site.name} every day.
          </p>
          <Button href="/book" variant="accent" size="lg">
            Book a Rider
          </Button>
          <p className="text-xs text-paper/50">
            Questions?{" "}
            <Link href="/contact" className="underline hover:text-paper">
              Talk to us
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-dark">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 text-muted">{description}</p> : null}
    </div>
  );
}

const FALLBACK_SLIDES = [
  { slug: "bike", name: "Bike", blurb: "Documents & small parcels" },
  { slug: "mini-van", name: "Mini Van", blurb: "Bulk parcels & electronics" },
  { slug: "mini-truck", name: "Mini Truck", blurb: "Furniture & heavy loads" },
];

/** Hero showcase — the vehicle photos, auto-rotating with a crossfade. */
const ROTATE_MS = 6000;

function HeroVehicles({ vehicles }: { vehicles: VehicleDTO[] }) {
  const slides =
    vehicles.length > 0
      ? vehicles.map((v) => ({ slug: v.slug, name: v.name, blurb: v.capacity }))
      : FALLBACK_SLIDES;
  const [i, setI] = useState(0);
  const idx = slides.length ? i % slides.length : 0;

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((n) => n + 1), ROTATE_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-paper shadow-pop ring-1 ring-paper/10">
        {slides.map((s, n) => (
          <img
            key={s.slug}
            src={vehicleImage(s.slug)}
            alt={s.name}
            loading={n === 0 ? "eager" : "lazy"}
            className={cn(
              "absolute inset-0 h-full w-full object-contain p-6 transition-opacity duration-700 ease-[var(--ease-out-soft)]",
              n === idx ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent p-4">
          <div>
            <p className="text-sm font-bold text-paper">{slides[idx]?.name}</p>
            {slides[idx]?.blurb ? (
              <p className="text-xs text-paper/70">{slides[idx].blurb}</p>
            ) : null}
          </div>
          <div className="flex gap-1.5 pb-0.5">
            {slides.map((s, n) => (
              <button
                key={s.slug}
                type="button"
                aria-label={`Show ${s.name}`}
                onClick={() => setI(n)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  n === idx ? "w-5 bg-accent" : "w-1.5 bg-paper/40 hover:bg-paper/70",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
