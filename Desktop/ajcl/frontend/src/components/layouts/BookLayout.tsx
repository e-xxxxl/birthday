import { Outlet } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Logo } from "@/components/ui/Logo";
import { RequireAuth } from "@/components/guards/RequireAuth";
import { BookingWizardProvider } from "@/components/booking/BookingWizardContext";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

export function BookLayout() {
  return (
    <RequireAuth>
      <div className="flex min-h-dvh flex-col bg-surface text-ink">
        <header className="sticky top-0 z-40 border-b border-line bg-paper">
          <div className="container-page flex h-16 items-center justify-between">
            <Logo />
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-ink-soft hover:text-ink"
              >
                My bookings
              </Link>
            </div>
          </div>
        </header>
        <BookingWizardProvider>
          <main className="flex-1">
            <Outlet />
          </main>
        </BookingWizardProvider>
      </div>
    </RequireAuth>
  );
}
