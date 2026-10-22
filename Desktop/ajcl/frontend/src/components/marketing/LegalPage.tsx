import type { ReactNode } from "react";
import { PageBanner } from "@/components/marketing/PageBanner";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageBanner title={title} crumb={title} image="warehouse" intro={`Last updated ${updated}`} />
      <div className="container-page py-16 md:py-24">
        <article className="mx-auto max-w-3xl space-y-6 text-[0.95rem] leading-relaxed text-ink-soft [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul_li]:mt-1">
          {children}
        </article>
      </div>
    </>
  );
}
