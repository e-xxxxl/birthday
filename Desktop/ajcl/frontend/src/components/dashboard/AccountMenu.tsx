
import { useEffect, useRef, useState } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

export function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() || "U";

  const links =
    user.role === "office_admin"
      ? [{ label: "Shipments desk", href: "/admin/shipments" }]
      : user.role === "admin"
      ? [
          { label: "Admin dashboard", href: "/admin" },
          { label: "Bookings", href: "/admin/bookings" },
          { label: "Vehicles & pricing", href: "/admin/vehicles" },
          { label: "Riders", href: "/admin/riders" },
          { label: "Partners", href: "/admin/partners" },
          { label: "Shipments", href: "/admin/shipments" },
          ...(user.superAdmin
            ? [
                { label: "Shipping settings", href: "/admin/shipping" },
                { label: "Website content", href: "/admin/site" },
                { label: "Team", href: "/admin/team" },
              ]
            : []),
        ]
      : user.role === "rider"
        ? [
            { label: "My deliveries", href: "/rider" },
            { label: "My route", href: "/rider/route" },
            { label: "Profile", href: "/rider/profile" },
          ]
        : [
            { label: "Dashboard", href: "/dashboard" },
            { label: "Rides", href: "/dashboard/bookings" },
            { label: "Shipments", href: "/dashboard/shipments" },
            ...(user.partner ? [{ label: "Account statement", href: "/dashboard/account" }] : []),
            { label: "Book a ride", href: "/book" },
            { label: "New shipment", href: "/send" },
          ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-line-strong py-1 pl-1 pr-3 transition hover:bg-surface"
      >
        <span className="grid size-8 place-items-center rounded-full bg-ink text-xs font-bold text-paper">
          {initials}
        </span>
        <span className="hidden text-sm font-semibold sm:block">{user.firstName}</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-paper shadow-card shadow-pop">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-bold">{user.fullName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <nav className="p-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-sm px-3 py-2 text-sm font-medium text-ink-soft hover:bg-surface hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-line p-1">
            <button
              type="button"
              onClick={() => logout()}
              className={cn(
                "block w-full rounded-sm px-3 py-2 text-left text-sm font-semibold",
                "text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]",
              )}
            >
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
