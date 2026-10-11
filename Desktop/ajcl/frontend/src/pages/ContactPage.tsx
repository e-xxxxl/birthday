import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { site } from "@/config/site";

export function ContactPage() {
  useDocumentTitle("Contact");

  const channels = [
    { label: "Phone", value: site.contact.phone, href: site.contact.phoneHref },
    { label: "WhatsApp", value: "Chat with us", href: site.contact.whatsappHref },
    { label: "Email", value: site.contact.email, href: `mailto:${site.contact.email}` },
    { label: "Instagram", value: "Send a DM", href: site.contact.instagram },
  ];

  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-dark">Contact</p>
        <h1 className="mt-3 text-4xl font-bold">We&apos;re here to help</h1>
        <p className="mt-3 text-muted">
          Reach out about a booking, a delivery in progress, or partnering with {site.name}.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="rounded-2xl border border-line bg-paper p-5 shadow-card transition hover:border-ink"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-muted">{c.label}</p>
              <p className="mt-1 text-lg font-bold">{c.value}</p>
            </a>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-surface p-6">
          <p className="text-sm text-muted">
            Operating base: <strong className="text-ink">{site.contact.address}</strong>
          </p>
          <Button href="/book" className="mt-4">
            Book a Rider
          </Button>
        </div>
      </div>
    </div>
  );
}
