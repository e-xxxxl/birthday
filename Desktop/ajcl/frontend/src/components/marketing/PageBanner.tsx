import type { ReactNode } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Wave } from "@/components/marketing/Wave";
import { photo, type MediaKey } from "@/config/media";

/** The navy banner at the top of an inner page: breadcrumb, title, and a photograph in a leaf-shaped frame. */
export function PageBanner({
  title,
  crumb,
  intro,
  image,
  children,
}: {
  title: string;
  /** The page's name in the breadcrumb. */
  crumb: string;
  intro?: string;
  image: MediaKey;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "22px 22px" }}
      />
      <div className="container-page relative grid items-center gap-10 pb-28 pt-12 md:pb-36 md:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
            <span aria-hidden>/</span>
            <span className="font-bold text-accent">{crumb}</span>
          </nav>
          <h1 className="mt-4 text-4xl font-bold leading-[1.08] text-white md:text-6xl">{title}</h1>
          {intro ? <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">{intro}</p> : null}
          {children ? <div className="mt-7">{children}</div> : null}
        </div>
        <div className="relative hidden lg:block">
          <span aria-hidden className="absolute -bottom-3 -left-3 h-full w-full rounded-tl-[7rem] rounded-br-[7rem] rounded-bl-2xl rounded-tr-2xl bg-accent" />
          <img
            src={photo(image, 1100)}
            alt=""
            fetchPriority="high"
            className="relative aspect-[16/10] w-full rounded-tl-[7rem] rounded-br-[7rem] rounded-bl-2xl rounded-tr-2xl object-cover"
          />
        </div>
      </div>
      <Wave />
    </section>
  );
}
