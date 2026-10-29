import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal, RevealImage } from "@/components/ui/Reveal";
import { PageBanner } from "@/components/marketing/PageBanner";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { photo, type MediaKey } from "@/config/media";
import { cn } from "@/lib/utils";

const SERVICES: { title: string; text: string; points: string[]; image: MediaKey; icon: IconName; href: string; cta: string }[] = [
  {
    title: "Local Delivery",
    text: "Book a bike, mini van, cargo van or mini truck for same-day pickup and delivery inside your city. Pay securely online and follow the rider as the job moves.",
    points: ["Bike, mini van, cargo van or mini truck", "The fare is shown before you pay", "Live tracking and photo proof"],
    image: "scooter",
    icon: "bike",
    href: "/book",
    cta: "Book a ride",
  },
  {
    title: "Interstate Shipping",
    text: "Send a parcel to any state. A rider collects it, or you bring it to our office. We weigh it, you choose a carrier, and we book it.",
    points: ["Rider pickup or office drop-off", "Weighed, then quoted with options", "A carrier tracking number"],
    image: "truckRoad",
    icon: "truck",
    href: "/send/interstate",
    cta: "Ship a package",
  },
  {
    title: "International Courier",
    text: "Documents and parcels to destinations around the world, priced from live carrier rates. You list what is inside for customs.",
    points: ["Live carrier rates", "An item list for customs", "Duties at the destination are paid by the receiver"],
    image: "ships",
    icon: "globe",
    href: "/quote",
    cta: "Get a quote",
  },
  {
    title: "Air Cargo",
    text: "For heavier or urgent consignments that need to travel by air, with clear handling and the paperwork taken care of.",
    points: ["Heavier, time-sensitive freight", "Priced by weight and route", "A quote on request"],
    image: "cargoPlane",
    icon: "plane",
    href: "/air-cargo",
    cta: "Air cargo details",
  },
  {
    title: "Sea Cargo",
    text: "The economical way to send large volumes overseas. Our current flier sets out the rates and what to expect.",
    points: ["Suited to large volumes", "A lower cost per kilo", "The current flier to view or download"],
    image: "port",
    icon: "ship",
    href: "/sea-cargo",
    cta: "Sea cargo details",
  },
  {
    title: "AJCL Express",
    text: "A scheduled, consolidated service. Prices are reviewed every month, and each month's list is published as a PDF.",
    points: ["Scheduled and consolidated", "A new price list every month", "Download the latest PDF"],
    image: "warehouse",
    icon: "box",
    href: "/express",
    cta: "See the price list",
  },
];

export function ServicesPage() {
  useDocumentTitle("Services");
  return (
    <>
      <PageBanner
        title="Our services"
        crumb="Services"
        image="truck"
        intro="Same-day riders, interstate shipping, international courier, air and sea cargo, and a monthly express service. Pick the one that fits."
      />
      <div className="container-page space-y-24 py-20 lg:space-y-32 lg:py-28">
        {SERVICES.map((s, i) => {
          const flip = i % 2 === 1;
          return (
            <section key={s.title} className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <RevealImage
                src={photo(s.image, 1000)}
                alt=""
                variant={flip ? "right" : "left"}
                className={cn(
                  "aspect-[5/4] w-full",
                  flip
                    ? "rounded-bl-[6rem] rounded-br-3xl rounded-tl-3xl rounded-tr-[6rem] lg:order-2"
                    : "rounded-bl-3xl rounded-br-[6rem] rounded-tl-[6rem] rounded-tr-3xl",
                )}
              />
              <Reveal variant={flip ? "left" : "right"} className={flip ? "lg:order-1" : ""}>
                <span className="grid size-14 place-items-center rounded-2xl bg-accent text-white">
                  <Icon name={s.icon} className="size-7" />
                </span>
                <h2 className="mt-5 text-3xl font-bold md:text-4xl">{s.title}</h2>
                <p className="mt-4 max-w-lg leading-relaxed text-muted">{s.text}</p>
                <ul className="mt-6 space-y-3">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-3 font-bold">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-dark">
                        <Icon name="check" className="size-3.5" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
                <Button href={s.href} className="mt-8" size="lg" arrow>
                  {s.cta}
                </Button>
              </Reveal>
            </section>
          );
        })}
      </div>
    </>
  );
}
