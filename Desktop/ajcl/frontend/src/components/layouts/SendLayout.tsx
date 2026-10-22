import { Outlet } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Logo } from "@/components/ui/Logo";
import { RequireAuth } from "@/components/guards/RequireAuth";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

/** Shell for choosing a shipment type and filling in the shipment wizard. */
export function SendLayout() {
  return (
    <RequireAuth>
      <div className="flex min-h-dvh flex-col bg-surface text-ink">
        <header className="sticky top-0 z-40 border-b border-line bg-paper">
          <div className="container-page flex h-16 items-center justify-between">
            <Logo />
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link href="/dashboard" className="text-sm font-semibold text-ink-soft hover:text-ink">
                My dashboard
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </RequireAuth>
  );
}
