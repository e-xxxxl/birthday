import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal, RevealImage } from "@/components/ui/Reveal";
import { PageBanner } from "@/components/marketing/PageBanner";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { photo } from "@/config/media";
import { site } from "@/config/site";

const VALUES: { icon: IconName; title: string; text: string }[] = [
  { icon: "clock", title: "Reliable", text: "Pickups and deliveries happen when they were booked for, and every status change is recorded." },
  { icon: "tag", title: "Clear on price", text: "Local fares show before you pay. Shipping is quoted from the real weight, with the breakdown in view." },
  { icon: "shield", title: "Careful with your goods", text: "Private handover codes and photo proof at pickup and at delivery protect each transfer." },
  { icon: "headset", title: "Easy to reach", text: "Call, message on WhatsApp or write to us." },
];

export function AboutPage() {
  useDocumentTitle("About us");
  return (
    <>
      <PageBanner
        title="About AJ Courier & Logistics"
        crumb="About Us"
        image="workers"
        intro="We move parcels for people and businesses: across the city in a day, to any state, and out to the rest of the world."
      />

      <section className="container-page grid items-center gap-16 py-20 lg:grid-cols-2 lg:py-28">
        <div className="relative mx-auto w-full max-w-lg pb-10 lg:max-w-none">
          <RevealImage
            src={photo("tablet", 900)}
            alt="A warehouse coordinator checking a shipment on a tablet"
            variant="left"
            className="aspect-[4/4.8] w-[72%] rounded-bl-3xl rounded-br-3xl rounded-tl-[6rem] rounded-tr-3xl"
          />
          <RevealImage
            src={photo("packing", 700)}
            alt="A team member taping a parcel closed"
            variant="zoom"
            delay={180}
            parallax={36}
            className="absolute bottom-0 right-0 aspect-[4/5] w-[52%] rounded-3xl border-[8px] border-paper shadow-pop"
          />
        </div>
        <Reveal variant="right">
          <span className="inline-block rounded-full bg-accent-soft px-4 py-1.5 text-sm font-bold text-accent-dark">Who we are</span>
          <h2 className="mt-5 text-3xl font-bold md:text-5xl">{site.name}: {site.tagline.toLowerCase()}</h2>
          <div className="mt-5 space-y-4 leading-relaxed text-muted">
            <p>
              {site.name} is built around a simple idea: sending something should be as easy as ordering it. You choose where it goes, see what it will cost,
              and follow it until it arrives.
            </p>
            <p>
              For deliveries inside the city we run our own riders, vans and trucks. For interstate and international shipments we weigh each parcel at our
              office, get live prices from carriers, and book the one you choose.
            </p>
            <p>Everything is handled from one account, so your bookings, payments and tracking stay in one place.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/services" size="lg" arrow>
              Our services
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Contact us
            </Button>
          </div>
        </Reveal>
      </section>

      <section className="bg-surface py-20 lg:py-28">
        <div className="container-page">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-5xl">How we work</h2>
            <p className="mt-4 text-muted">Four things we hold to on every job.</p>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} variant={i % 2 === 0 ? "left" : "right"} delay={i * 60} className="flex gap-5 rounded-3xl bg-paper p-7 shadow-card">
                <span className={`grid size-14 shrink-0 place-items-center rounded-2xl text-white ${i % 2 === 0 ? "bg-accent" : "bg-ink"}`}>
                  <Icon name={v.icon} className="size-7" />
                </span>
                <span>
                  <span className="block text-lg font-bold">{v.title}</span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-muted">{v.text}</span>
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
