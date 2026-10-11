
import { useState } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { HashNavLink } from "@/components/ui/HashNavLink";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const links = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Services", href: "/#services" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Contact", href: "/contact" },
];

function NavItem({
  href,
  className,
  onNavigate,
  children,
}: {
  href: string;
  className?: string;
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  return href.includes("#") ? (
    <HashNavLink href={href} className={className} onNavigate={onNavigate}>
      {children}
    </HashNavLink>
  ) : (
    <Link href={href} className={className} onClick={onNavigate}>
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <NavItem
              key={l.href}
              href={l.href}
              className="cursor-pointer text-sm font-semibold text-ink-soft transition hover:text-ink"
            >
              {l.label}
            </NavItem>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!loading && user ? (
            <>
              <Button href={user.role === "admin" ? "/admin" : "/dashboard"} variant="secondary" size="sm">
                Dashboard
              </Button>
              <Button href="/book" size="sm">
                Book a Ride
              </Button>
            </>
          ) : (
            <>
              <Button href="/login" variant="ghost" size="sm">
                Log in
              </Button>
              <Button href="/book" size="sm">
                Book a Ride
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-lg border border-line-strong md:hidden"
        >
          <span className="relative block h-3 w-4">
            <span
              className={cn(
                "absolute left-0 top-0 h-0.5 w-4 bg-ink transition",
                open && "translate-y-[5px] rotate-45",
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-[5px] h-0.5 w-4 bg-ink transition",
                open && "opacity-0",
              )}
            />
            <span
              className={cn(
                "absolute bottom-0 left-0 h-0.5 w-4 bg-ink transition",
                open && "-translate-y-[5px] -rotate-45",
              )}
            />
          </span>
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-paper md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {links.map((l) => (
              <NavItem
                key={l.href}
                href={l.href}
                onNavigate={() => setOpen(false)}
                className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface"
              >
                {l.label}
              </NavItem>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {!loading && user ? (
                <Button href={user.role === "admin" ? "/admin" : "/dashboard"} variant="secondary" fullWidth>
                  Dashboard
                </Button>
              ) : (
                <Button href="/login" variant="secondary" fullWidth>
                  Log in
                </Button>
              )}
              <Button href="/book" fullWidth>
                Book a Ride
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
