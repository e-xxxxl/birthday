import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { useShippingConfig } from "@/hooks/useShippingConfig";
import { cn } from "@/lib/utils";
import { homeFor } from "@/lib/roles";
import { site } from "@/config/site";

/** Every service has its own page. */
export const SERVICE_LINKS: { label: string; href: string; icon: IconName; blurb: string }[] = [
  { label: "Book a Ride", href: "/book", icon: "bike", blurb: "Same-day riders, vans and trucks" },
  { label: "Interstate Shipping", href: "/send/interstate", icon: "truck", blurb: "Parcels to any state" },
  { label: "International Courier", href: "/quote", icon: "globe", blurb: "Live quotes, worldwide" },
  { label: "Air Cargo", href: "/air-cargo", icon: "plane", blurb: "Urgent and heavy freight" },
  { label: "Sea Cargo", href: "/sea-cargo", icon: "ship", blurb: "Large volumes, lower cost" },
  { label: "AJCL Express", href: "/express", icon: "box", blurb: "Monthly price list" },
];

type MenuItem = { label: string; href: string; icon: IconName; blurb: string; external?: boolean };

/** Reach us. Kept in a "More" menu so the main links always fit on one line. */
const MORE_LINKS: MenuItem[] = [
  { label: "Blog", href: "/blog", icon: "tag", blurb: "News and updates" },
  { label: "Contact Us", href: "/contact", icon: "mail", blurb: "Questions, quotes and support" },
  { label: "Call us", href: site.contact.phoneHref, icon: "phone", blurb: site.contact.phone, external: true },
  { label: "WhatsApp", href: site.contact.whatsappHref, icon: "whatsapp", blurb: "Chat with our team", external: true },
];

const NAV: { label: string; href: string; menu?: "services" | "more" }[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services", menu: "services" },
  { label: "Book a Ride", href: "/book" },
  { label: "AJCL Express", href: "/express" },
  { label: "More", href: "/contact", menu: "more" },
];

/** A drop-down under a main link. Opens on hover, and for keyboard users when focus is inside it. */
function NavMenu({
  label,
  href,
  active,
  items,
  width,
  open,
  setOpen,
}: {
  label: string;
  href: string;
  active: boolean;
  items: MenuItem[];
  width: string;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Link
        href={href}
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[0.95rem] font-bold transition-colors",
          active ? "text-accent" : "text-white/90 hover:text-accent",
        )}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {label}
        <svg viewBox="0 0 12 12" className={cn("size-3 transition-transform", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2.5 4.5L6 8l3.5-3.5" />
        </svg>
      </Link>
      <div
        className={cn(
          "absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition-all duration-200",
          width,
          open ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0",
        )}
      >
        <div className="grid gap-1 rounded-3xl bg-paper p-3 text-ink shadow-pop">
          {items.map((s) => {
            const inner = (
              <>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-dark">
                  <Icon name={s.icon} className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold">{s.label}</span>
                  <span className="block text-xs text-muted">{s.blurb}</span>
                </span>
              </>
            );
            const cls = "flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-surface";
            return s.external ? (
              <a key={s.href} href={s.href} className={cls} {...(s.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                {inner}
              </a>
            ) : (
              <Link key={s.href} href={s.href} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  const config = useShippingConfig();
  return (
    <div className="hidden bg-navy-deep text-[0.8rem] text-white/80 md:block">
      <div className="container-page flex h-10 items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <Icon name="pin" className="size-4 text-accent" />
            {site.contact.address}
          </span>
          <a href={`mailto:${site.contact.email}`} className="flex items-center gap-2 hover:text-white">
            <Icon name="mail" className="size-4 text-accent" />
            {site.contact.email}
          </a>
          {config?.office.openingHours ? (
            <span className="hidden items-center gap-2 lg:flex">
              <Icon name="clock" className="size-4 text-accent" />
              {config.office.openingHours}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/60">Follow us</span>
          <a href={site.contact.whatsappHref} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hover:text-accent">
            <Icon name="whatsapp" className="size-[18px]" />
          </a>
          <a href={site.contact.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-accent">
            <Icon name="instagram" className="size-[18px]" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [more, setMore] = useState(false);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setOpen(false);
    setMenu(false);
    setMore(false);
  }, [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const inServices = SERVICE_LINKS.some((s) => pathname.startsWith(s.href)) || pathname.startsWith("/services");

  return (
    <>
      <TopBar />
      <header className={cn("sticky top-0 z-50 bg-ink text-white transition-shadow duration-300", stuck && "shadow-pop")}>
        <div className="container-page relative flex h-20 items-center justify-between gap-4">
          {/* The logo sits on a white tab with a curved corner, so its own colours show */}
          <div className="relative z-10 -ml-5 flex h-full items-center rounded-br-[2.75rem] bg-paper pl-5 pr-9 md:-ml-8 md:pl-8 md:pr-12">
            <Logo className="h-12 md:h-14" />
            <span aria-hidden className="absolute -right-2.5 bottom-0 h-3 w-24 rounded-full bg-accent" />
          </div>

          <nav className="hidden flex-nowrap items-center gap-0.5 whitespace-nowrap xl:flex" aria-label="Main">
            {NAV.map((l) =>
              l.menu === "services" ? (
                <NavMenu key={l.href + l.label} label={l.label} href={l.href} active={inServices} items={SERVICE_LINKS} width="w-[26rem]" open={menu} setOpen={setMenu} />
              ) : l.menu === "more" ? (
                <NavMenu key={l.href + l.label} label={l.label} href={l.href} active={pathname.startsWith("/contact") || pathname.startsWith("/blog")} items={MORE_LINKS} width="w-80" open={more} setOpen={setMore} />
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-2 text-[0.95rem] font-bold transition-colors",
                    isActive(l.href) ? "text-accent" : "text-white/90 hover:text-accent",
                  )}
                >
                  {l.label}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 whitespace-nowrap xl:flex">
            <a href={site.contact.phoneHref} className="mr-1 hidden items-center gap-2.5 text-left 2xl:flex">
              <span className="grid size-10 place-items-center rounded-full bg-white/10 text-accent">
                <Icon name="phone" className="size-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-[0.7rem] text-white/60">24/7 call us now</span>
                <span className="block text-sm font-bold">{site.contact.phone}</span>
              </span>
            </a>
            {!loading && user ? (
              <Button href={homeFor(user.role)} variant="outline-light" size="sm">
                Dashboard
              </Button>
            ) : (
              <>
                <Link href="/login" className="px-2 text-sm font-bold text-white/90 hover:text-accent">
                  Log in
                </Link>
                <Button href="/signup" variant="outline-light" size="sm">
                  Sign up
                </Button>
              </>
            )}
            <Button href="/send" size="sm">
              Send a package
            </Button>
          </div>

          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-11 place-items-center rounded-xl bg-white/10 text-white xl:hidden"
          >
            <span className="relative block h-3 w-5">
              <span className={cn("absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition", open && "translate-y-[5px] rotate-45")} />
              <span className={cn("absolute left-0 top-[5px] h-0.5 w-5 rounded bg-current transition", open && "opacity-0")} />
              <span className={cn("absolute bottom-0 left-0 h-0.5 w-5 rounded bg-current transition", open && "-translate-y-[5px] -rotate-45")} />
            </span>
          </button>
        </div>

        {open ? (
          <div className="border-t border-white/10 bg-ink xl:hidden">
            <div className="container-page flex max-h-[75vh] flex-col overflow-y-auto py-3">
              {NAV.map((l) => (
                <div key={l.href}>
                  <Link href={l.href} className={cn("block rounded-xl px-3 py-3 text-base font-bold", isActive(l.href) ? "text-accent" : "text-white")}>
                    {l.label}
                  </Link>
                  {l.menu ? (
                    <div className="mb-2 ml-3 grid gap-0.5 border-l-2 border-white/15 pl-3">
                      {(l.menu === "more" ? MORE_LINKS : SERVICE_LINKS).map((s) =>
                        "external" in s && s.external ? (
                          <a key={s.href} href={s.href} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-white/80 hover:text-accent">
                            <Icon name={s.icon} className="size-4 text-accent" />
                            {s.label}
                          </a>
                        ) : (
                          <Link key={s.href} href={s.href} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-white/80 hover:text-accent">
                            <Icon name={s.icon} className="size-4 text-accent" />
                            {s.label}
                          </Link>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
              <div className="grid gap-2 py-4">
                {!loading && user ? (
                  <Button href={homeFor(user.role)} variant="outline-light" fullWidth>
                    Dashboard
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button href="/login" variant="outline-light">
                      Log in
                    </Button>
                    <Button href="/signup" variant="outline-light">
                      Sign up
                    </Button>
                  </div>
                )}
                <Button href="/send" fullWidth>
                  Send a package
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}
