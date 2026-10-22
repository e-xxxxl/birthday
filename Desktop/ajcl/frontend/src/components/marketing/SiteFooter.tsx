import { AppLink as Link } from "@/components/ui/AppLink";
import { HashNavLink } from "@/components/ui/HashNavLink";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { DisclaimerNotice } from "@/components/shipping/ShipmentBits";
import { SERVICE_LINKS } from "@/components/marketing/SiteHeader";
import { useShippingConfig } from "@/hooks/useShippingConfig";
import { site } from "@/config/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const config = useShippingConfig();

  return (
    <footer className="relative mt-auto bg-navy-deep text-white">
      <svg aria-hidden viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[40px] w-full -translate-y-full md:h-[64px]">
        <path d="M0 80 L0 40 C 420 -10, 980 -10, 1440 46 L1440 80 Z" fill="var(--color-navy-deep)" />
      </svg>

      <div className="container-page grid gap-12 pb-12 pt-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo href="/" variant="light" className="h-14" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
            {site.tagline}. Same-day delivery, interstate shipping and international courier, booked online and tracked to the door.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a href={site.contact.whatsappHref} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-accent">
              <Icon name="whatsapp" className="size-5" />
            </a>
            <a href={site.contact.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-accent">
              <Icon name="instagram" className="size-5" />
            </a>
            <a href={`mailto:${site.contact.email}`} aria-label="Email" className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-accent">
              <Icon name="mail" className="size-5" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Services</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {SERVICE_LINKS.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="text-white/70 transition-colors hover:text-accent">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Company</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              { label: "About us", href: "/about" },
              { label: "All services", href: "/services" },
              { label: "Our fleet", href: "/#fleet" },
              { label: "Contact", href: "/contact" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms & Conditions", href: "/terms" },
            ].map((i) => (
              <li key={i.href}>
                {i.href.includes("#") ? (
                  <HashNavLink href={i.href} className="cursor-pointer text-white/70 transition-colors hover:text-accent">
                    {i.label}
                  </HashNavLink>
                ) : (
                  <Link href={i.href} className="text-white/70 transition-colors hover:text-accent">
                    {i.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Get in touch</h3>
          <ul className="mt-5 space-y-4 text-sm text-white/75">
            <li className="flex gap-3">
              <Icon name="phone" className="mt-0.5 size-5 shrink-0 text-accent" />
              <a href={site.contact.phoneHref} className="hover:text-accent">
                {site.contact.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <Icon name="mail" className="mt-0.5 size-5 shrink-0 text-accent" />
              <a href={`mailto:${site.contact.email}`} className="break-all hover:text-accent">
                {site.contact.email}
              </a>
            </li>
            <li className="flex gap-3">
              <Icon name="pin" className="mt-0.5 size-5 shrink-0 text-accent" />
              <span>{site.contact.address}</span>
            </li>
            {config?.office.openingHours ? (
              <li className="flex gap-3">
                <Icon name="clock" className="mt-0.5 size-5 shrink-0 text-accent" />
                <span>{config.office.openingHours}</span>
              </li>
            ) : null}
          </ul>
          <Button href="/send" size="sm" className="mt-6">
            Send a package
          </Button>
        </div>
      </div>

      <div className="container-page pb-6">
        <DisclaimerNotice paragraphs={config?.disclaimerParagraphs} tone="dark" />
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-start justify-between gap-2 py-5 text-xs text-white/55 sm:flex-row sm:items-center">
          <p>
            © {year} {site.copyrightHolder}. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
