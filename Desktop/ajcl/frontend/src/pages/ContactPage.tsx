import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { PageBanner } from "@/components/marketing/PageBanner";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useShippingConfig } from "@/hooks/useShippingConfig";
import { site } from "@/config/site";

export function ContactPage() {
  useDocumentTitle("Contact");
  const config = useShippingConfig();

  const channels: { icon: IconName; label: string; value: string; href: string }[] = [
    { icon: "phone", label: "Call us", value: site.contact.phone, href: site.contact.phoneHref },
    { icon: "whatsapp", label: "WhatsApp", value: "Chat with us", href: site.contact.whatsappHref },
    { icon: "mail", label: "Email", value: site.contact.email, href: `mailto:${site.contact.email}` },
    { icon: "instagram", label: "Instagram", value: "Send a message", href: site.contact.instagram },
  ];
  const office = config?.office;

  return (
    <>
      <PageBanner
        title="We are here to help"
        crumb="Contact"
        image="tablet"
        intro={`Ask about a booking, a delivery in progress, or working with ${site.name}.`}
      />
      <div className="container-page grid gap-12 py-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:py-28">
        <div className="grid gap-5 sm:grid-cols-2">
          {channels.map((c, i) => (
            <Reveal key={c.label} delay={i * 80}>
              <a
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="group flex h-full items-center gap-4 rounded-3xl bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-ink hover:text-white"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-white">
                  <Icon name={c.icon} className="size-7" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-muted group-hover:text-white/70">{c.label}</span>
                  <span className="block break-words text-lg font-bold">{c.value}</span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal variant="right" className="self-start rounded-[2rem] bg-ink p-8 text-white">
          <h2 className="text-2xl font-bold text-white">Our office</h2>
          <ul className="mt-6 space-y-4 text-white/85">
            <li className="flex gap-3">
              <Icon name="pin" className="mt-0.5 size-5 shrink-0 text-accent" />
              <span>{office?.line1 ? [office.line1, office.line2, office.city, office.state].filter(Boolean).join(", ") : site.contact.address}</span>
            </li>
            {office?.openingHours ? (
              <li className="flex gap-3">
                <Icon name="clock" className="mt-0.5 size-5 shrink-0 text-accent" />
                <span>{office.openingHours}</span>
              </li>
            ) : null}
          </ul>
          <Button href="/send" className="mt-8" fullWidth arrow>
            Send a package
          </Button>
        </Reveal>
      </div>
    </>
  );
}
