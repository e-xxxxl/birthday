import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Floating "contact us" control shown on marketing / auth pages. Hidden inside
 * the dashboards and the booking flow, where it would cover form controls.
 * Tap to reveal WhatsApp / call / email / contact page.
 */
export function ContactButton() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/rider") ||
    pathname.startsWith("/book")
  ) {
    return null;
  }

  const actions = [
    {
      label: "WhatsApp",
      href: site.contact.whatsappHref,
      external: true,
      icon: (
        <path d="M12 2a10 10 0 0 0-8.7 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.1.1.3 0 .5l-.4.5-.3.3c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.3.1.2.1.7-.1 1.3Z" />
      ),
    },
    {
      label: "Call us",
      href: site.contact.phoneHref,
      external: true,
      icon: (
        <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V21c0 .6-.4 1-1 1A17 17 0 0 1 3 5c0-.6.5-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1l-2.3 2.3Z" />
      ),
    },
    {
      label: "Email",
      href: `mailto:${site.contact.email}`,
      external: true,
      icon: (
        <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1.4 2L12 12l7.6-5H4.4Z" />
      ),
    },
    {
      label: "Contact page",
      href: "/contact",
      external: false,
      icon: (
        <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
      ),
    },
  ];

  return (
    <div
      className="fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {open ? (
        <div className="mb-1 flex flex-col items-end gap-2">
          {actions.map((a) => {
            const inner = (
              <>
                <span className="text-sm font-semibold">{a.label}</span>
                <span className="grid size-8 place-items-center rounded-sm bg-navy text-paper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    {a.icon}
                  </svg>
                </span>
              </>
            );
            const cls =
              "flex items-center gap-2.5 rounded-sm border border-line bg-paper py-1.5 pl-4 pr-1.5 shadow-pop transition hover:border-navy animate-fade-in-up";
            return a.external ? (
              <a
                key={a.label}
                href={a.href}
                target={a.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className={cls}
                onClick={() => setOpen(false)}
              >
                {inner}
              </a>
            ) : (
              <Link key={a.label} href={a.href} className={cls} onClick={() => setOpen(false)}>
                {inner}
              </Link>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        aria-label={open ? "Close contact menu" : "Contact us"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid size-14 place-items-center rounded-sm bg-navy text-paper shadow-pop transition hover:brightness-110 active:scale-95",
          open && "rotate-45",
        )}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-5A8.4 8.4 0 1 1 21 11.5Z" />
            <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
          </svg>
        )}
      </button>
    </div>
  );
}
