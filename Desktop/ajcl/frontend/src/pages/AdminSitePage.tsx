import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert, LoadingBlock } from "@/components/ui/Feedback";
import { Input, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { apiUrl, http, HttpError } from "@/lib/http";
import { photoToJpegDataUrl, POSTER_STEPS } from "@/lib/image";
import { formatDateTime } from "@/lib/utils";
import type { Slide, PriceListInfo, SeaFlier, PopupFlyer } from "@/types/shipping";

type Content = {
  slides: Slide[];
  airCargo: { title: string; intro: string; sections: { heading: string; body: string }[]; rateCard: SeaFlier | null; notes: string[] };
  seaCargo: { title: string; intro: string; sections: { heading: string; body: string }[]; notes: string[] };
  flyers: PopupFlyer[];
  defaults: { notes: string[] };
  express: { title: string; intro: string; paragraphs: string[] };
  seaFlier: SeaFlier | null;
  priceList: PriceListInfo | null;
  priceListHistory: { id: string; monthLabel: string; effectiveMonth: string; uploadedByName: string | null; uploadedAt: string; isCurrent: boolean }[];
};

const SLIDE_NAMES: Record<string, string> = {
  local: "1. Rider's App",
  international: "2. International courier",
  air: "3. Air cargo",
  sea: "4. Sea cargo",
  express: "5. AJCL Express",
};

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read that file."));
    r.readAsDataURL(file);
  });
}

function thisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AdminSitePage() {
  useDocumentTitle("Website content");
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => http.get<Content>("/api/admin/site/content"), []);
  const [busy, setBusy] = useState<string | null>(null);

  const [slides, setSlides] = useState<Slide[]>([]);
  const [air, setAir] = useState({ title: "", intro: "", sections: [] as { heading: string; body: string }[] });
  const [express, setExpress] = useState({ title: "", intro: "", paragraphs: "" });
  const [month, setMonth] = useState(thisMonth());
  const [airNotes, setAirNotes] = useState("");
  const [sea, setSea] = useState({ title: "", intro: "", sections: [] as { heading: string; body: string }[] });
  const [seaNotes, setSeaNotes] = useState("");
  const [fl, setFl] = useState({ title: "", link: "", days: "7", start: "" });
  const [flFile, setFlFile] = useState<File | null>(null);
  const [flPreview, setFlPreview] = useState<{ url: string; portrait: boolean } | null>(null);
  const [daysEdit, setDaysEdit] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      if (flPreview) URL.revokeObjectURL(flPreview.url);
    };
  }, [flPreview]);

  useEffect(() => {
    if (!data) return;
    setSlides(data.slides);
    setAir({ title: data.airCargo.title, intro: data.airCargo.intro, sections: data.airCargo.sections });
    setAirNotes(data.airCargo.notes.join("\n\n"));
    setSea({ title: data.seaCargo.title, intro: data.seaCargo.intro, sections: data.seaCargo.sections });
    setSeaNotes(data.seaCargo.notes.join("\n\n"));
    setExpress({ title: data.express.title, intro: data.express.intro, paragraphs: data.express.paragraphs.join("\n\n") });
  }, [data]);

  if (loading && !data) return <LoadingBlock />;
  if (error || !data) return <Alert tone="danger">{error ?? "Could not load content."}</Alert>;

  async function run(key: string, fn: () => Promise<unknown>, success: string) {
    setBusy(key);
    try {
      await fn();
      toast.success(success);
      reload();
    } catch (err) {
      toast.error("That did not work", err instanceof HttpError ? err.message : err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  const setSlide = (key: string, p: Partial<Slide>) => setSlides(slides.map((s) => (s.key === key ? { ...s, ...p } : s)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">Website content</h1>
        <p className="text-sm text-muted">The homepage slider, the Air Cargo and Express pages, the Sea Cargo flier and the monthly price list.</p>
      </div>

      <Card>
        <CardHeader
          title="Pop-up flyers"
          description="A flyer opens over the homepage for the days you choose, then stops showing by itself. Portrait posters work best (for example 1080 x 1350 pixels)."
        />
        <CardBody className="space-y-5">
          <div className="grid gap-5 md:grid-cols-[14rem_minmax(0,1fr)]">
            <div>
              {flPreview ? (
                <img src={flPreview.url} alt="Flyer preview" className="aspect-[4/5] w-full rounded-2xl border border-line object-contain bg-surface" />
              ) : (
                <div className="grid aspect-[4/5] w-full place-items-center rounded-2xl border border-dashed border-line-strong bg-surface p-4 text-center text-xs text-muted">Choose a flyer picture</div>
              )}
              <label className="mt-3 block cursor-pointer rounded-xl border-[1.5px] border-line-strong px-4 py-2.5 text-center text-sm font-bold hover:border-ink">
                {flFile ? "Choose another picture" : "Choose picture"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    let portrait = true;
                    try {
                      const bmp = await createImageBitmap(file);
                      portrait = bmp.height >= bmp.width;
                      bmp.close();
                    } catch {
                      /* keep the default */
                    }
                    setFlFile(file);
                    setFlPreview({ url, portrait });
                  }}
                />
              </label>
              {flPreview && !flPreview.portrait ? <p className="mt-2 text-xs text-[var(--color-warning)]">This picture is wide. It will still show in full, but a portrait picture fills the pop-up better.</p> : null}
            </div>

            <div className="space-y-3">
              <Input label="Title (optional)" value={fl.title} onChange={(e) => setFl({ ...fl, title: e.target.value })} maxLength={120} hint="Only used as the picture description" />
              <Input label="Link (optional)" value={fl.link} onChange={(e) => setFl({ ...fl, link: e.target.value })} maxLength={300} hint="Where a click goes, like /send or https://example.com" />
              <div>
                <p className="text-sm font-semibold">How long should it show?</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {["1", "3", "7", "14", "30"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFl({ ...fl, days: d })}
                      className={`rounded-full border px-4 py-1.5 text-sm font-bold ${fl.days === d ? "border-ink bg-ink text-white" : "border-line-strong hover:border-ink"}`}
                    >
                      {d} {d === "1" ? "day" : "days"}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={fl.days}
                    onChange={(e) => setFl({ ...fl, days: e.target.value })}
                    aria-label="Number of days"
                    className="h-9 w-24 rounded-xl border-[1.5px] border-line-strong px-3 text-sm"
                  />
                  <span className="text-sm text-muted">days</span>
                </div>
              </div>
              <Input label="Start (optional)" type="datetime-local" value={fl.start} onChange={(e) => setFl({ ...fl, start: e.target.value })} hint="Leave empty to start now" containerClassName="max-w-xs" />
              <p className="text-sm text-muted">
                {Number(fl.days) >= 1
                  ? `Shows until ${formatDateTime(new Date((fl.start ? new Date(fl.start).getTime() : Date.now()) + Number(fl.days) * 86_400_000).toISOString())}.`
                  : "Enter the number of days."}
              </p>
              <Button
                disabled={!flFile || !(Number(fl.days) >= 1)}
                loading={busy === "flyer"}
                onClick={() =>
                  run(
                    "flyer",
                    async () => {
                      if (!flFile) return;
                      const dataUrl = await photoToJpegDataUrl(flFile, { steps: POSTER_STEPS, targetBytes: 1_800_000 });
                      await http.post("/api/admin/site/flyers", {
                        title: fl.title || undefined,
                        linkUrl: fl.link || undefined,
                        durationDays: Number(fl.days),
                        startsAt: fl.start ? new Date(fl.start).toISOString() : undefined,
                        filename: flFile.name,
                        dataUrl,
                      });
                      setFlFile(null);
                      setFlPreview(null);
                      setFl({ title: "", link: "", days: fl.days, start: "" });
                    },
                    "Flyer published",
                  )
                }
              >
                Publish flyer
              </Button>
            </div>
          </div>

          {data.flyers.length > 0 ? (
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {data.flyers.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center gap-4 p-3">
                  <img src={apiUrl(f.imageUrl)} alt="" className="h-24 w-[4.5rem] shrink-0 rounded-xl border border-line object-cover" />
                  <div className="min-w-0 flex-1 space-y-1 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{f.title || "Untitled flyer"}</span>
                      <Badge tone={f.status === "live" ? "success" : f.status === "scheduled" ? "info" : f.status === "off" ? "warning" : "neutral"}>
                        {f.status === "live" ? "Showing now" : f.status === "scheduled" ? "Scheduled" : f.status === "off" ? "Hidden" : "Ended"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted">
                      {formatDateTime(f.startsAt)} to {formatDateTime(f.endsAt)} ({f.durationDays} {f.durationDays === 1 ? "day" : "days"})
                    </p>
                    {f.linkUrl ? <p className="truncate text-xs text-muted">Links to {f.linkUrl}</p> : null}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={daysEdit[f.id] ?? String(f.durationDays)}
                        onChange={(e) => setDaysEdit({ ...daysEdit, [f.id]: e.target.value })}
                        aria-label="Days to show"
                        className="h-8 w-20 rounded-lg border-[1.5px] border-line-strong px-2 text-sm"
                      />
                      <button
                        type="button"
                        className="text-sm font-semibold underline"
                        onClick={() => run(`days-${f.id}`, () => http.patch(`/api/admin/site/flyers/${f.id}`, { durationDays: Number(daysEdit[f.id] ?? f.durationDays) }), "Duration updated")}
                      >
                        Set days
                      </button>
                      <span className="text-line-strong">|</span>
                      <button type="button" className="text-sm font-semibold underline" onClick={() => run(`tg-${f.id}`, () => http.patch(`/api/admin/site/flyers/${f.id}`, { active: !f.active }), f.active ? "Flyer hidden" : "Flyer shown")}>
                        {f.active ? "Hide" : "Show"}
                      </button>
                      <span className="text-line-strong">|</span>
                      <button type="button" className="text-sm font-semibold text-[var(--color-danger)] hover:underline" onClick={() => run(`del-${f.id}`, () => http.del(`/api/admin/site/flyers/${f.id}`), "Flyer deleted")}>
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No flyers yet.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Homepage slides" description="Change the wording and picture of each slide. A slide with no picture uses the standard design." />
        <CardBody className="space-y-5">
          {slides.map((s) => (
            <div key={s.key} className="space-y-3 rounded-sm border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">{SLIDE_NAMES[s.key]}</p>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4" checked={s.active !== false} onChange={(e) => setSlide(s.key, { active: e.target.checked })} />
                  Show
                </label>
              </div>
              <Input label="Heading" value={s.title} onChange={(e) => setSlide(s.key, { title: e.target.value })} maxLength={120} />
              <Textarea label="Text" value={s.subtitle} onChange={(e) => setSlide(s.key, { subtitle: e.target.value })} maxLength={240} className="min-h-20" />
              <Input label="Button text" value={s.ctaLabel} onChange={(e) => setSlide(s.key, { ctaLabel: e.target.value })} maxLength={40} containerClassName="max-w-xs" />
              <div className="flex flex-wrap items-center gap-3">
                {s.imageUrl ? <img src={apiUrl(s.imageUrl)} alt="" className="h-16 w-28 rounded-sm border border-line object-cover" /> : <span className="text-xs text-muted">Using the standard design</span>}
                <label className="cursor-pointer rounded-sm border border-line-strong px-4 py-2 text-sm font-semibold hover:border-ink">
                  {s.imageUrl ? "Replace picture" : "Upload picture"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      await run(`img-${s.key}`, async () => {
                        const dataUrl = await photoToJpegDataUrl(file);
                        await http.post("/api/admin/site/assets", { purpose: "slide", slideKey: s.key, filename: file.name, dataUrl });
                      }, "Picture saved");
                    }}
                  />
                </label>
                {s.imageUrl ? (
                  <button type="button" className="text-sm font-semibold text-[var(--color-danger)] hover:underline" onClick={() => run(`rm-${s.key}`, () => http.del(`/api/admin/site/assets/slide/${s.key}`), "Picture removed")}>
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          <Button
            loading={busy === "slides"}
            onClick={() =>
              run("slides", () => http.put("/api/admin/site/content", { slides: slides.map((s) => ({ key: s.key, title: s.title, subtitle: s.subtitle, ctaLabel: s.ctaLabel, active: s.active !== false })) }), "Slides saved")
            }
          >
            Save slides
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Sea cargo rate card" description="Shown on the Sea Cargo page and in the homepage pop-up, and visitors can download it. Image or PDF." />
        <CardBody className="space-y-3">
          {data.seaFlier ? (
            <p className="text-sm">
              Current: <a className="font-semibold underline" href={apiUrl(data.seaFlier.url)} target="_blank" rel="noreferrer">{data.seaFlier.filename}</a>
            </p>
          ) : (
            <p className="text-sm text-muted">No rate card uploaded yet.</p>
          )}
          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer rounded-sm border border-line-strong px-4 py-2 text-sm font-semibold hover:border-ink">
              {data.seaFlier ? "Replace rate card" : "Upload rate card"}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  await run("flier", async () => {
                    const dataUrl = file.type === "application/pdf" ? await readFile(file) : await photoToJpegDataUrl(file);
                    await http.post("/api/admin/site/assets", { purpose: "flier", filename: file.name, dataUrl });
                  }, "Rate card saved");
                }}
              />
            </label>
            {data.seaFlier ? (
              <button type="button" className="text-sm font-semibold text-[var(--color-danger)] hover:underline" onClick={() => run("rm-flier", () => http.del("/api/admin/site/assets/flier"), "Rate card removed")}>
                Remove
              </button>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="AJCL Express price list" description="Upload this month's PDF. The important notice is added as its last page. Older lists are kept here, but only the newest is public." />
        <CardBody className="space-y-4">
          {data.priceList ? (
            <p className="text-sm">
              Public now: <strong>{data.priceList.monthLabel}</strong>{" "}
              <a className="ml-1 font-semibold underline" href={apiUrl(data.priceList.downloadUrl)} target="_blank" rel="noreferrer">
                Download
              </a>
            </p>
          ) : (
            <p className="text-sm text-muted">No price list uploaded yet.</p>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <Input label="Effective month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} containerClassName="w-48" />
            <label className="cursor-pointer rounded-sm bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-[#2b2b2b]">
              {busy === "pl" ? "Uploading…" : "Upload PDF"}
              <input
                type="file"
                accept="application/pdf"
                className="sr-only"
                disabled={busy === "pl"}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  await run("pl", async () => {
                    const dataUrl = await readFile(file);
                    await http.post("/api/admin/site/price-lists", { effectiveMonth: month, filename: file.name, dataUrl });
                  }, "Price list published");
                }}
              />
            </label>
          </div>
          {data.priceListHistory.length > 0 ? (
            <ul className="divide-y divide-line rounded-sm border border-line text-sm">
              {data.priceListHistory.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span>
                    <strong>{p.monthLabel}</strong>
                    <span className="ml-2 text-xs text-muted">uploaded {formatDateTime(p.uploadedAt)}{p.uploadedByName ? ` by ${p.uploadedByName}` : ""}</span>
                  </span>
                  {p.isCurrent ? <Badge tone="success">Public</Badge> : <Badge>Archived</Badge>}
                </li>
              ))}
            </ul>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="AJCL Express page text" />
        <CardBody className="space-y-3">
          <Input label="Title" value={express.title} onChange={(e) => setExpress({ ...express, title: e.target.value })} />
          <Textarea label="Introduction" value={express.intro} onChange={(e) => setExpress({ ...express, intro: e.target.value })} />
          <Textarea label="Paragraphs (separate with a blank line)" value={express.paragraphs} onChange={(e) => setExpress({ ...express, paragraphs: e.target.value })} className="min-h-32" />
          <Button
            loading={busy === "express"}
            onClick={() =>
              run("express", () => http.put("/api/admin/site/content", { express: { title: express.title, intro: express.intro, paragraphs: express.paragraphs.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) } }), "Express page saved")
            }
          >
            Save Express page
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Air cargo page text" />
        <CardBody className="space-y-3">
          <Input label="Title" value={air.title} onChange={(e) => setAir({ ...air, title: e.target.value })} />
          <Textarea label="Introduction" value={air.intro} onChange={(e) => setAir({ ...air, intro: e.target.value })} />
          {air.sections.map((sec, i) => (
            <div key={i} className="space-y-2 rounded-sm border border-line p-3">
              <Input label="Heading" value={sec.heading} onChange={(e) => setAir({ ...air, sections: air.sections.map((x, n) => (n === i ? { ...x, heading: e.target.value } : x)) })} />
              <Textarea label="Text" value={sec.body} onChange={(e) => setAir({ ...air, sections: air.sections.map((x, n) => (n === i ? { ...x, body: e.target.value } : x)) })} />
              <button type="button" className="text-sm font-semibold text-[var(--color-danger)] hover:underline" onClick={() => setAir({ ...air, sections: air.sections.filter((_, n) => n !== i) })}>
                Remove section
              </button>
            </div>
          ))}
          <button type="button" className="text-sm font-semibold text-ink-soft hover:text-ink" onClick={() => setAir({ ...air, sections: [...air.sections, { heading: "", body: "" }] })}>
            + Add section
          </button>
          <Textarea
            label="Notes under the enquiry form (separate with a blank line)"
            value={airNotes}
            onChange={(e) => setAirNotes(e.target.value)}
            hint="Leave empty to use the standard export declaration notice"
            className="min-h-32"
          />
          <div>
            <Button
              loading={busy === "air"}
              onClick={() =>
                run(
                  "air",
                  () =>
                    http.put("/api/admin/site/content", {
                      airCargo: { title: air.title, intro: air.intro, sections: air.sections.filter((s) => s.heading || s.body), notes: airNotes.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) },
                    }),
                  "Air cargo page saved",
                )
              }
            >
              Save Air cargo page
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Air cargo rate card" description="A rate card image or a PDF shown on the Air Cargo page, with a download button." />
        <CardBody className="space-y-3">
          {data.airCargo.rateCard ? (
            <p className="text-sm">
              Current: <a className="font-semibold underline" href={apiUrl(data.airCargo.rateCard.url)} target="_blank" rel="noreferrer">{data.airCargo.rateCard.filename}</a>
            </p>
          ) : (
            <p className="text-sm text-muted">No rate card uploaded yet.</p>
          )}
          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer rounded-xl border-[1.5px] border-line-strong px-4 py-2 text-sm font-bold hover:border-ink">
              {data.airCargo.rateCard ? "Replace rate card" : "Upload rate card"}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  await run("air-card", async () => {
                    const dataUrl = file.type === "application/pdf" ? await readFile(file) : await photoToJpegDataUrl(file, { steps: POSTER_STEPS, targetBytes: 2_500_000 });
                    await http.post("/api/admin/site/assets", { purpose: "air_rate_card", filename: file.name, dataUrl });
                  }, "Rate card saved");
                }}
              />
            </label>
            {data.airCargo.rateCard ? (
              <button type="button" className="text-sm font-semibold text-[var(--color-danger)] hover:underline" onClick={() => run("rm-air-card", () => http.del("/api/admin/site/assets/air_rate_card"), "Rate card removed")}>
                Remove
              </button>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Sea cargo page text" description="The rate card above (Sea cargo rate card) appears on this page too." />
        <CardBody className="space-y-3">
          <Input label="Title" value={sea.title} onChange={(e) => setSea({ ...sea, title: e.target.value })} />
          <Textarea label="Introduction" value={sea.intro} onChange={(e) => setSea({ ...sea, intro: e.target.value })} />
          {sea.sections.map((sec, i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-line p-3">
              <Input label="Heading" value={sec.heading} onChange={(e) => setSea({ ...sea, sections: sea.sections.map((x, n) => (n === i ? { ...x, heading: e.target.value } : x)) })} />
              <Textarea label="Text" value={sec.body} onChange={(e) => setSea({ ...sea, sections: sea.sections.map((x, n) => (n === i ? { ...x, body: e.target.value } : x)) })} />
              <button type="button" className="text-sm font-semibold text-[var(--color-danger)] hover:underline" onClick={() => setSea({ ...sea, sections: sea.sections.filter((_, n) => n !== i) })}>
                Remove section
              </button>
            </div>
          ))}
          <button type="button" className="text-sm font-semibold text-ink-soft hover:text-ink" onClick={() => setSea({ ...sea, sections: [...sea.sections, { heading: "", body: "" }] })}>
            + Add section
          </button>
          <Textarea
            label="Notes under the enquiry form (separate with a blank line)"
            value={seaNotes}
            onChange={(e) => setSeaNotes(e.target.value)}
            hint="Leave empty to use the standard export declaration notice"
            className="min-h-32"
          />
          <div>
            <Button
              loading={busy === "sea"}
              onClick={() =>
                run(
                  "sea",
                  () =>
                    http.put("/api/admin/site/content", {
                      seaCargo: { title: sea.title, intro: sea.intro, sections: sea.sections.filter((s) => s.heading || s.body), notes: seaNotes.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) },
                    }),
                  "Sea cargo page saved",
                )
              }
            >
              Save Sea cargo page
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
