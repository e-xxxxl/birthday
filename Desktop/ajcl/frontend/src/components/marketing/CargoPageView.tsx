import { Icon, type IconName } from "@/components/ui/Icon";
import { LoadingBlock, Alert } from "@/components/ui/Feedback";
import { Reveal, RevealImage } from "@/components/ui/Reveal";
import { PageBanner } from "@/components/marketing/PageBanner";
import { CargoEnquiryForm, CargoNotes, RateCard } from "@/components/marketing/CargoBits";
import { photo, type MediaKey } from "@/config/media";
import type { CargoPage } from "@/types/shipping";

const ICONS: IconName[] = ["box", "map", "tag", "shield", "clock", "headset"];

/** Air Cargo and Sea Cargo share one layout: the text the Super Admin edits, a rate card, the enquiry form and the notes. */
export function CargoPageView({
  service,
  page,
  loading,
  error,
  crumb,
  bannerImage,
  sideImage,
  sideAlt,
}: {
  service: "air" | "sea";
  page?: CargoPage;
  loading: boolean;
  error?: string;
  crumb: string;
  bannerImage: MediaKey;
  sideImage: MediaKey;
  sideAlt: string;
}) {
  const label = service === "air" ? "Air cargo" : "Sea cargo";
  return (
    <>
      <PageBanner title={page?.title ?? label} crumb={crumb} image={bannerImage} intro={page?.intro} />
      <div className="container-page py-20 lg:py-28">
        {loading && !page ? <LoadingBlock /> : null}
        {error && !page ? <Alert tone="danger">{error}</Alert> : null}
        {page ? (
          <div className="space-y-20 lg:space-y-28">
            <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-6">
                {page.sections.map((s, i) => (
                  <Reveal key={`${s.heading}-${i}`} variant="left" delay={i * 70} className="flex gap-5 rounded-3xl bg-surface p-7">
                    <span className={`grid size-14 shrink-0 place-items-center rounded-2xl text-white ${i % 2 === 0 ? "bg-accent" : "bg-ink"}`}>
                      <Icon name={ICONS[i % ICONS.length]} className="size-7" />
                    </span>
                    <span>
                      <h2 className="text-xl font-bold">{s.heading}</h2>
                      <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{s.body}</p>
                    </span>
                  </Reveal>
                ))}
              </div>

              <Reveal variant="right" className="self-start lg:sticky lg:top-28">
                <h2 className="mb-5 text-3xl font-bold md:text-4xl">{label} rates</h2>
                <RateCard doc={page.rateCard} title={`${label} rate card`} emptyText="Send us your details below and we will reply with the current rates." />
              </Reveal>
            </div>

            <div id="enquiry" className="grid scroll-mt-28 gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <Reveal variant="left">
                <CargoEnquiryForm service={service} />
              </Reveal>
              <div className="space-y-6 self-start lg:sticky lg:top-28">
                <RevealImage
                  src={photo(sideImage, 800)}
                  alt={sideAlt}
                  variant="right"
                  className="aspect-[4/3] w-full rounded-bl-3xl rounded-br-[5rem] rounded-tl-[5rem] rounded-tr-3xl"
                />
                <Reveal variant="right" delay={120}>
                  <CargoNotes notes={page.notes} />
                </Reveal>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
