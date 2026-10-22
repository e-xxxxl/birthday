import { Outlet } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { Reveal, RevealImage } from "@/components/ui/Reveal";
import { photo } from "@/config/media";
import { site } from "@/config/site";

const PERKS = ["Book local rides and shipments in one place", "See the price before you pay", "Follow every parcel to the door"];

/** Sign in and sign up: a navy panel with photography on the left, the form on the right. */
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh bg-surface text-ink lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <aside className="relative hidden overflow-hidden rounded-br-[6rem] rounded-tr-[6rem] bg-ink text-white lg:flex lg:flex-col">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "22px 22px" }}
        />
        <span aria-hidden className="absolute -left-24 -top-24 size-80 rounded-full bg-sky/20" />
        <div className="relative z-10 w-fit rounded-br-[2.5rem] bg-paper px-10 py-4">
          <Logo className="h-14" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center gap-10 px-14 pb-14 pt-6">
          <div className="relative mx-auto w-full max-w-md pb-6 pl-4">
            <span aria-hidden className="absolute inset-y-4 -right-2 left-8 rounded-bl-3xl rounded-br-[5rem] rounded-tl-[5rem] rounded-tr-3xl bg-accent" />
            <RevealImage
              src={photo("workers", 900)}
              alt=""
              parallax={0}
              variant="zoom"
              className="relative aspect-[5/4] w-full rounded-bl-3xl rounded-br-[5rem] rounded-tl-[5rem] rounded-tr-3xl"
            />
            <img
              src={photo("scooter", 400)}
              alt=""
              className="absolute -left-2 bottom-0 size-32 rounded-full border-[6px] border-ink object-cover object-[50%_65%] ring-4 ring-accent"
            />
          </div>
          <Reveal delay={150}>
            <h2 className="max-w-md text-4xl font-bold leading-tight text-white">Every parcel, from pickup to proof of delivery.</h2>
            <ul className="mt-6 space-y-3">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-3 font-bold text-white/90">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-white">
                    <Icon name="check" className="size-3.5" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="container-page flex h-20 items-center justify-between lg:hidden">
          <Logo className="h-12" />
          <Link href="/" className="text-sm font-bold text-ink-soft hover:text-accent-dark">
            Home
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>
        <footer className="container-page py-6 text-center text-sm text-muted">
          <Link href="/" className="inline-flex items-center gap-2 font-bold hover:text-accent-dark">
            <Icon name="arrow-left" className="size-4" />
            Back to {site.name}
          </Link>
        </footer>
      </div>
    </div>
  );
}
