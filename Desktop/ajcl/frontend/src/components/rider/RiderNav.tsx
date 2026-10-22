
import { AppLink as Link } from "@/components/ui/AppLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { label: "My deliveries", href: "/rider", exact: true },
  { label: "My route", href: "/rider/route" },
  { label: "Profile", href: "/rider/profile" },
];

export function RiderNav({ className }: { className?: string }) {
  const pathname = useLocation().pathname;
  return (
    <nav className={cn("no-scrollbar flex items-center gap-1.5 overflow-x-auto", className)}>
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-sm px-3.5 py-1.5 text-sm font-semibold transition",
              active ? "bg-ink text-paper" : "text-ink-soft hover:bg-surface",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
