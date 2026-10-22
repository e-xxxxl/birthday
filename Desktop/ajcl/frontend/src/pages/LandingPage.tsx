import { useRef, useState } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal, RevealImage } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/Feedback";
import { HeroSlider, DEFAULT_SLIDES } from "@/components/marketing/HeroSlider";
import { SeaFlierModal } from "@/components/marketing/SeaFlierModal";
import { FlyerPopup } from "@/components/marketing/FlyerPopup";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import { vehicleImage } from "@/lib/vehicle-media";
import { photo, type MediaKey } from "@/config/media";
import { site } from "@/config/site";
import type { VehicleDTO } from "@/types";
import type { Slide, SeaFlier, PopupFlyer } from "@/types/shipping";

const QUICK: { icon: IconName; title: string; text: string; href: string }[] = [
  { icon: "bike", title: "Book a Ride", text: "Same-day delivery in your city", href: "/book" },
  { icon: "truck", title: "Interstate Shipping", text: "Parcels to any state", href: "/send/interstate" },
  { icon: "globe", title: "International Quote", text: "Live carrier rates", href: "/quote" },
  { icon: "plane", title: "Air and Sea Cargo", text: "Freight for bigger loads", href: "/services" },
];

const CHECKS = [
  "Same-day city delivery",
  "Interstate and worldwide",
  "Live status tracking",
  "Private handover codes",
  "Price shown before you pay",
  "Photo proof at delivery",
];

const SERVICES: { title: string; text: string; image: MediaKey; icon: IconName; href: string }[] = [
  { title: "Local Delivery", text: "Riders, vans and mini trucks for same-day delivery across your city, with live tracking.", image: "scooter", icon: "bike", href: "/book" },
  { title: "Interstate Shipping", text: "Send parcels to any state. Drop them at our office or have a rider collect them.", image: "truckRoad", icon: "truck", href: "/send/interstate" },
  { title: "International Courier", text: "Documents and parcels worldwide, priced from live carrier rates once we weigh them.", image: "port", icon: "globe", href: "/quote" },
  { title: "Air Cargo", text: "Heavier consignments by air, with the paperwork handled for you.", image: "cargoPlane", icon: "plane", href: "/air-cargo" },
  { title: "Sea Cargo", text: "Large volumes overseas at a lower cost per kilo. See the current flier.", image: "ships", icon: "ship", href: "/sea-cargo" },
  { title: "AJCL Express", text: "A scheduled, consolidated service with a new price list every month.", image: "warehouse", icon: "box", href: "/express" },
];

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "map", title: "Tell us where", text: "Choose local, interstate or international, and say where it is going." },
  { icon: "tag", title: "See the price", text: "Local fares show before you pay. Shipments are weighed, then quoted with options." },
  { icon: "box", title: "Hand it over", text: "A rider collects it, or you drop it at our office. A private code protects the handover." },
  { icon: "truck", title: "Follow it home", text: "Every status change is recorded and sent to you until it is delivered." },
];

const STATS: { icon: IconName; value: string; label: string }[] = [
  { icon: "truck", value: "3", label: "Vehicle classes" },
  { icon: "clock", value: "24/7", label: "Online booking" },
  { icon: "pin", value: "Live", label: "Delivery tracking" },
  { icon: "map", value: "37", label: "States, including the FCT" },
];

export function LandingPage() {
  useDocumentTitle(`${site.tagline}`);
  const { data, loading } = useAsync(() => http.get<{ vehicles: VehicleDTO[] }>("/api/vehicles"), []);
  const vehicles = data?.vehicles ?? [];
  const { data: home } = useAsync(
    () => http.get<{ slides: Slide[]; seaFlier: SeaFlier | null; flyers?: PopupFlyer[] }>("/api/site/home").catch(() => null),
    [],
  );
  const [flierOpen, setFlierOpen] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const slide = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * (rail.current.clientWidth * 0.8), behavior: "smooth" });

  return (
    <>
      <HeroSlider slides={home?.slides ?? DEFAULT_SLIDES} onOpenFlier={() => setFlierOpen(true)} />
      <SeaFlierModal open={flierOpen} onClose={() => setFlierOpen(false)} flier={home?.seaFlier ?? null} />
      <FlyerPopup flyers={home?.flyers ?? []} />

      {/* Quick ways in, sitting on the curve of the hero */}
      <section className="container-page relative z-10 -mt-20 md:-mt-28">
        <Reveal className="grid gap-2 rounded-[2rem] bg-paper p-3 shadow-pop sm:grid-cols-2 lg:grid-cols-4">
          {QUICK.map((q, i) => (
            <Link key={q.title} href={q.href} className="group flex items-center gap-4 rounded-3xl p-4 transition-colors hover:bg-surface">
              <span className={`grid size-14 shrink-0 place-items-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-110 ${i % 2 === 0 ? "bg-accent" : "bg-ink"}`}>
                <Icon name={q.icon} className="size-7" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold">{q.title}</span>
                <span className="block text-sm text-muted">{q.text}</span>
              </span>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* Why us: words on the left, an overlapping pair of photographs on the right */}
      <section className="container-page grid items-center gap-16 py-24 lg:grid-cols-2 lg:py-32">
        <Reveal variant="left">
          <span className="inline-block rounded-full bg-accent-soft px-4 py-1.5 text-sm font-bold text-accent-dark">Why choose us</span>
          <h2 className="mt-5 text-4xl font-bold leading-[1.1] md:text-5xl">We keep your parcel safe from pickup to proof of delivery</h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
            From a document across town to a crate across the sea, one account covers it. You see the price first, every handover is protected by a private
            code, and you can follow each stage as it happens.
          </p>
          <ul className="mt-7 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {CHECKS.map((c) => (
              <li key={c} className="flex items-center gap-3 text-[0.95rem] font-bold">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-white">
                  <Icon name="check" className="size-3.5" />
                </span>
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Button href="/about" variant="navy" size="lg" arrow>
              About us
            </Button>
            <a href={site.contact.phoneHref} className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-dark">
                <Icon name="phone" className="size-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-xs text-muted">More information</span>
                <span className="block text-base font-bold">{site.contact.phone}</span>
              </span>
            </a>
          </div>
        </Reveal>

        <div className="relative mx-auto w-full max-w-lg pb-12 pl-4 lg:max-w-none">
          <RevealImage
            src={photo("workers", 1000)}
            alt="Port staff reviewing a shipment beside a container yard"
            variant="right"
            className="aspect-[4/4.6] w-[78%] rounded-bl-3xl rounded-br-3xl rounded-tl-[6rem] rounded-tr-3xl"
          />
          <RevealImage
            src={photo("forklift", 800)}
            alt="A forklift moving pallets in a warehouse"
            variant="zoom"
            delay={200}
            parallax={40}
            className="absolute bottom-0 right-0 aspect-[4/3] w-[58%] rounded-3xl border-[8px] border-paper shadow-pop"
          />
          <Reveal variant="zoom" delay={350} className="absolute -left-2 bottom-14 rounded-3xl bg-accent px-6 py-5 text-white shadow-pop md:-left-6">
            <span className="block text-4xl font-bold leading-none">24/7</span>
            <span className="mt-1 block text-sm font-semibold text-white/90">Online booking</span>
          </Reveal>
          <svg aria-hidden viewBox="0 0 60 120" className="absolute -right-1 top-6 hidden h-28 text-accent md:block" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 14l22 22-22 22M10 62l22 22-22 22" opacity=".9" />
          </svg>
        </div>
      </section>

      {/* Facts, over a photograph */}
      <section className="relative isolate overflow-hidden bg-ink py-16 md:py-20">
        <img src={photo("port", 1600)} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-ink/90" />
        <div className="container-page grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 90} className="flex flex-col items-start gap-4 rounded-3xl bg-white/[0.07] p-6 ring-1 ring-white/10 sm:flex-row sm:items-center">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-white">
                <Icon name={s.icon} className="size-7" />
              </span>
              <span>
                <span className="block text-3xl font-bold leading-none text-white md:text-4xl">{s.value}</span>
                <span className="mt-1.5 block text-sm text-white/70">{s.label}</span>
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Services: arch-topped pictures on a rail you can scroll */}
      <section id="services" className="relative overflow-hidden bg-surface py-24 lg:py-32">
        <div className="container-page">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-accent-soft px-4 py-1.5 text-sm font-bold text-accent-dark">Our services</span>
            <h2 className="mt-5 text-4xl font-bold md:text-5xl">A delivery service for every distance</h2>
            <p className="mt-4 text-muted">Each service has its own page with the details, the prices and a way to book.</p>
          </Reveal>

          <div ref={rail} className="no-scrollbar -mx-5 mt-16 flex scroll-pl-5 snap-x snap-mandatory md:scroll-pl-8 gap-6 overflow-x-auto px-5 pb-6 pt-2 md:-mx-8 md:px-8">
            {SERVICES.map((s, i) => (
              <Link
                key={s.title}
                href={s.href}
                className="group w-[78%] shrink-0 snap-start sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
              >
                <div className={`relative ${i % 2 === 1 ? "lg:mt-10" : ""}`}>
                  <RevealImage
                    src={photo(s.image, 800)}
                    alt=""
                    delay={i * 70}
                    parallax={0}
                    className="aspect-[4/4.6] w-full rounded-b-3xl rounded-t-[999px]"
                    imgClassName="transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute -bottom-8 left-1/2 grid size-16 -translate-x-1/2 place-items-center rounded-full bg-accent text-white shadow-pop ring-[6px] ring-surface transition-transform duration-300 group-hover:-translate-y-1">
                    <Icon name={s.icon} className="size-7" />
                  </span>
                </div>
                <div className={`px-3 pt-14 text-center ${i % 2 === 1 ? "lg:pb-10" : ""}`}>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent-dark">
                    Read more
                    <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex justify-center gap-3">
            <button type="button" aria-label="Scroll services left" onClick={() => slide(-1)} className="grid size-12 place-items-center rounded-full border border-line-strong bg-paper text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white">
              <Icon name="arrow-left" />
            </button>
            <button type="button" aria-label="Scroll services right" onClick={() => slide(1)} className="grid size-12 place-items-center rounded-full border border-line-strong bg-paper text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white">
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      </section>

      {/* Fleet: each vehicle stands in front of a round backdrop that rises above its panel */}
      <section id="fleet" className="container-page py-24 lg:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-sky-soft px-4 py-1.5 text-sm font-bold text-info">Our fleet</span>
          <h2 className="mt-5 text-4xl font-bold md:text-5xl">Pick the vehicle that fits the load</h2>
          <p className="mt-4 text-muted">Bikes, mini vans and mini trucks. The fare for your route shows before you pay.</p>
        </Reveal>
        <div className="mt-24 grid gap-x-8 gap-y-20 md:grid-cols-3">
          {loading && vehicles.length === 0
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-3xl" />)
            : vehicles.map((v, i) => (
                <Reveal key={v.slug} delay={i * 110} className="relative rounded-3xl bg-surface px-7 pb-8 pt-0 text-center">
                  <div className="relative mx-auto -mt-16 grid size-52 place-items-center rounded-full bg-sky-soft">
                    <img src={vehicleImage(v.slug)} alt={v.name} loading="lazy" className="size-44 object-contain mix-blend-multiply" />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold">{v.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{v.description}</p>
                  <span className="mt-5 inline-block rounded-full bg-accent-soft px-4 py-1.5 text-sm font-bold text-accent-dark">{v.capacity}</span>
                </Reveal>
              ))}
        </div>
      </section>

      {/* How it works: four stops on a dashed route */}
      <section id="how-it-works" className="bg-surface py-24 lg:py-32">
        <div className="container-page">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-accent-soft px-4 py-1.5 text-sm font-bold text-accent-dark">How it works</span>
            <h2 className="mt-5 text-4xl font-bold md:text-5xl">From booking to doorstep</h2>
          </Reveal>
          <div className="relative mt-20">
            <svg aria-hidden viewBox="0 0 1000 60" preserveAspectRatio="none" className="absolute inset-x-[12%] top-6 hidden h-14 w-[76%] text-line-strong md:block">
              <path d="M0 30 C 125 -10, 125 70, 250 30 S 375 -10, 500 30 S 625 70, 750 30 S 875 -10, 1000 30" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="3 12" strokeLinecap="round" />
            </svg>
            <ol className="relative grid gap-12 md:grid-cols-4 md:gap-6">
              {STEPS.map((s, i) => (
                <Reveal as="li" key={s.title} delay={i * 130} className="flex gap-5 md:flex-col md:items-center md:text-center">
                  <span className={`relative z-10 grid size-[4.5rem] shrink-0 place-items-center rounded-full text-white ring-[8px] ring-surface ${i % 2 === 0 ? "bg-accent" : "bg-ink"}`}>
                    <Icon name={s.icon} className="size-8" />
                  </span>
                  <span>
                    <span className="block text-lg font-bold">{s.title}</span>
                    <span className="mt-2 block text-sm leading-relaxed text-muted md:mx-auto md:max-w-[15rem]">{s.text}</span>
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="container-page py-20 lg:py-28">
        <Reveal variant="zoom" className="relative isolate overflow-hidden rounded-[2.5rem] bg-ink">
          <RevealImage
            src={photo("truck", 1400)}
            alt="A freight truck on an open road"
            variant="right"
            className="absolute inset-y-0 right-0 hidden w-[48%] rounded-l-[9rem] md:block"
          />
          <span aria-hidden className="absolute -bottom-24 -left-16 size-72 rounded-full bg-accent/90" />
          <div className="relative grid gap-6 px-8 py-14 md:w-[56%] md:px-14 md:py-20">
            <h2 className="text-3xl font-bold leading-tight text-white md:text-5xl">Something to send? We will take it from here.</h2>
            <p className="max-w-md text-white/80">Book online in a few minutes, or call and speak to our team.</p>
            <div className="flex flex-wrap items-center gap-5">
              <Button href="/send" size="lg" variant="light" arrow>
                Send a package
              </Button>
              <a href={site.contact.phoneHref} className="flex items-center gap-2.5 font-bold text-white">
                <Icon name="phone" className="size-5 text-accent" />
                {site.contact.phone}
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
