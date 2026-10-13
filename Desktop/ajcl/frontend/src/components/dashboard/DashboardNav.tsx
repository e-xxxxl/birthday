import { AppLink as Link } from "@/components/ui/AppLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";

const baseItems: { label: string; href: string; exact?: boolean }[] = [
  { label: "Overview", href: "/dashboard", exact: true },
  { label: "My bookings", href: "/dashboard/bookings" },
];

export function DashboardNav({ className }: { className?: string }) {
  const pathname = useLocation().pathname;
  const { user } = useAuth();
  // Partners get an account statement (what they've been billed and what they owe).
  const items = user?.partner
    ? [...baseItems, { label: "Account", href: "/dashboard/account" }]
    : baseItems;
  return (
    <nav className={cn("no-scrollbar flex items-center gap-1.5 overflow-x-auto", className)}>
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
              active ? "bg-ink text-paper" : "text-ink-soft hover:bg-surface",
            )}
          >
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/book"
        className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-sm font-bold text-ink transition hover:bg-[var(--color-accent-dark)]"
      >
        Book a delivery
      </Link>
    </nav>
  );
}
