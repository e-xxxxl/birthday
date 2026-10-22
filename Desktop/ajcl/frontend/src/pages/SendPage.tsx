import { AppLink as Link } from "@/components/ui/AppLink";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal, RevealImage } from "@/components/ui/Reveal";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { photo, type MediaKey } from "@/config/media";

const OPTIONS: { href: string; title: string; where: string; body: string; image: MediaKey; icon: IconName; facts: string[] }[] = [
  {
    href: "/book",
    title: "Local delivery",
    where: "Within your city",
    body: "A rider, van or truck takes it from pickup to the door. You see the fare, pay, and follow it live.",
    image: "scooter",
    icon: "bike",
    facts: ["Same day", "Pay upfront", "Live tracking"],
  },
  {
    href: "/send/interstate",
    title: "Interstate shipping",
    where: "Any state in Nigeria",
    body: "Drop the parcel at our office or have a rider collect it. We weigh it, then you choose a carrier.",
    image: "truckRoad",
    icon: "truck",
    facts: ["Pickup or drop-off", "Carrier options", "Tracking number"],
  },
  {
    href: "/send/international",
    title: "International shipping",
    where: "Outside Nigeria",
    body: "The same steps as interstate, with an item list for customs. The receiver pays duties at the destination.",
    image: "ships",
    icon: "globe",
    facts: ["Pickup or drop-off", "Live carrier rates", "Customs item list"],
  },
];

export function SendPage() {
  useDocumentTitle("What are you sending?");
  return (
    <div className="container-page py-12 md:py-16">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold md:text-5xl">What are you sending?</h1>
        <p className="mt-3 text-muted">Choose the kind of delivery that fits and we will take you through it.</p>
      </Reveal>
      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {OPTIONS.map((o, i) => (
          <Reveal key={o.href} delay={i * 110} className={i === 1 ? "md:mt-8" : ""}>
            <Link href={o.href} className="group block overflow-hidden rounded-[2rem] bg-paper shadow-card ring-1 ring-line transition-all duration-300 hover:-translate-y-1.5 hover:shadow-pop">
              <div className="relative p-3 pb-0">
                <RevealImage
                  src={photo(o.image, 700)}
                  alt=""
                  parallax={0}
                  className="aspect-[4/3] w-full rounded-t-[999px] rounded-b-2xl"
                  imgClassName="transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute -bottom-7 left-1/2 grid size-14 -translate-x-1/2 place-items-center rounded-full bg-accent text-white shadow-pop ring-[5px] ring-paper">
                  <Icon name={o.icon} className="size-6" />
                </span>
              </div>
              <div className="px-6 pb-7 pt-11 text-center">
                <h2 className="text-xl font-bold">{o.title}</h2>
                <p className="mt-1 text-sm font-bold text-accent-dark">{o.where}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{o.body}</p>
                <ul className="mt-4 flex flex-wrap justify-center gap-2">
                  {o.facts.map((f) => (
                    <li key={f} className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-ink-soft">
                      {f}
                    </li>
                  ))}
                </ul>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-ink group-hover:text-accent-dark">
                  Start
                  <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
