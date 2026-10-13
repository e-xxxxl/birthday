
import { AppLink as Link } from "@/components/ui/AppLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

const baseItems = [
  { label: "Overview", href: "/admin" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Riders", href: "/admin/riders" },
  { label: "Partners", href: "/admin/partners" },
  { label: "Vehicles & Pricing", href: "/admin/vehicles" },
];

export function AdminNav() {
  const pathname = useLocation().pathname;
  const { user } = useAuth();
  const items = user?.superAdmin
    ? [...baseItems, { label: "Team", href: "/admin/team" }]
    : baseItems;
  return (
    <div className="border-t border-paper/10 bg-ink">
      <div className="container-page no-scrollbar flex gap-1 overflow-x-auto">
        {items.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "border-accent text-paper"
                  : "border-transparent text-paper/60 hover:text-paper",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
