import { Outlet } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { RequireRider } from "@/components/guards/RequireRider";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { AccountMenu } from "@/components/dashboard/AccountMenu";
import { RiderNav } from "@/components/rider/RiderNav";

export function RiderLayout() {
  return (
    <RequireRider>
      <div className="flex min-h-dvh flex-col bg-surface text-ink">
        <header className="sticky top-0 z-40 border-b border-line bg-paper">
          <div className="container-page flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Logo />
              <span className="hidden rounded-sm bg-surface-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-soft sm:block">
                Rider
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell />
              <AccountMenu />
            </div>
          </div>
          <div className="border-t border-line">
            <RiderNav className="container-page py-2" />
          </div>
        </header>
        <main className="flex-1 overflow-x-clip">
          <div className="container-page min-w-0 py-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </RequireRider>
  );
}
