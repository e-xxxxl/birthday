import { AppLink as Link } from "@/components/ui/AppLink";
import { HashNavLink } from "@/components/ui/HashNavLink";
import { Logo } from "@/components/ui/Logo";
import { site } from "@/config/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo href="/" />
          <p className="mt-4 max-w-xs text-sm text-muted">
            {site.tagline}. Book a bike, mini van or mini truck for same-day pickup and delivery.
          </p>
        </div>

        <FooterCol
          title="Company"
          items={[
            { label: "How it works", href: "/#how-it-works" },
            { label: "Services", href: "/#services" },
            { label: "Pricing", href: "/#pricing" },
          ]}
        />
        <FooterCol
          title="Legal"
          items={[
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms & Conditions", href: "/terms" },
            { label: "Contact", href: "/contact" },
          ]}
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Get in touch</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            <li>
              <a href={site.contact.phoneHref} className="hover:text-ink">
                {site.contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.contact.email}`} className="hover:text-ink">
                {site.contact.email}
              </a>
            </li>
            <li>
              <a href={site.contact.whatsappHref} className="hover:text-ink" target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </li>
            <li className="text-muted">{site.contact.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <p>
            © {year} {site.copyrightHolder}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms &amp; Conditions
            </Link>
            <Link href="/contact" className="hover:text-ink">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{title}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.href}>
            {i.href.includes("#") ? (
              <HashNavLink
                href={i.href}
                className="cursor-pointer text-ink-soft transition hover:text-ink"
              >
                {i.label}
              </HashNavLink>
            ) : (
              <Link href={i.href} className="text-ink-soft transition hover:text-ink">
                {i.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
