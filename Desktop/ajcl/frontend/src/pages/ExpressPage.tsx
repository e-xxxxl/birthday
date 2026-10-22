import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LoadingBlock } from "@/components/ui/Feedback";
import { Reveal, RevealImage } from "@/components/ui/Reveal";
import { PageBanner } from "@/components/marketing/PageBanner";
import { DisclaimerNotice } from "@/components/shipping/ShipmentBits";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { apiUrl, http } from "@/lib/http";
import { photo } from "@/config/media";
import type { PriceListInfo } from "@/types/shipping";

type Page = {
  title: string;
  intro: string;
  paragraphs: string[];
  priceList: PriceListInfo | null;
  disclaimerParagraphs: string[];
};

export function ExpressPage() {
  useDocumentTitle("AJCL Express");
  const { data, loading } = useAsync(() => http.get<{ page: Page }>("/api/site/express"), []);
  const page = data?.page;

  return (
    <>
      <PageBanner title={page?.title ?? "AJCL Express"} crumb="AJCL Express" image="warehouse" intro={page?.intro} />
      <div className="container-page py-20 lg:py-28">
        {loading && !page ? <LoadingBlock /> : null}
        {page ? (
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div>
              <Reveal variant="left" className="space-y-5 text-lg leading-relaxed text-ink-soft">
                {page.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </Reveal>
              <RevealImage
                src={photo("forklift", 1000)}
                alt="A forklift loading pallets in a warehouse"
                variant="up"
                className="mt-10 aspect-[16/9] w-full rounded-bl-3xl rounded-br-[5rem] rounded-tl-3xl rounded-tr-3xl"
              />
              <DisclaimerNotice paragraphs={page.disclaimerParagraphs} className="mt-10" />
            </div>

            <Reveal variant="right" className="self-start rounded-[2rem] bg-ink p-8 text-white lg:sticky lg:top-28">
              {page.priceList ? (
                <>
                  <span className="grid size-14 place-items-center rounded-2xl bg-accent text-white">
                    <Icon name="tag" className="size-7" />
                  </span>
                  <p className="mt-5 text-sm text-white/70">Current price list</p>
                  <p className="mt-1 text-4xl font-bold leading-tight text-white">{page.priceList.monthLabel}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    These prices apply for {page.priceList.monthLabel}. The important notice is on the last page.
                  </p>
                  <Button href={apiUrl(page.priceList.downloadUrl)} size="lg" className="mt-7" fullWidth arrow download={page.priceList.filename}>
                    Download PDF
                  </Button>
                </>
              ) : (
                <>
                  <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-accent">
                    <Icon name="tag" className="size-7" />
                  </span>
                  <p className="mt-5 text-2xl font-bold text-white">Not published yet</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    This month's price list has not been uploaded. Contact us and we will send you the current rates.
                  </p>
                  <Button href="/contact" size="lg" className="mt-7" fullWidth arrow>
                    Contact us
                  </Button>
                </>
              )}
            </Reveal>
          </div>
        ) : null}
      </div>
    </>
  );
}
