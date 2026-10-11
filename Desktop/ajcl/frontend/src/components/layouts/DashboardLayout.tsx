import { Outlet } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { RequireAuth } from "@/components/guards/RequireAuth";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { AccountMenu } from "@/components/dashboard/AccountMenu";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export function DashboardLayout() {
  return (
    <RequireAuth>
      <div className="flex min-h-dvh flex-col bg-surface text-ink">
        <header className="sticky top-0 z-40 border-b border-line bg-paper">
          <div className="container-page flex h-16 items-center justify-between gap-3">
            <Logo />
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell />
              <AccountMenu />
            </div>
          </div>
          <div className="border-t border-line">
            <DashboardNav className="container-page py-2" />
          </div>
        </header>
        <main className="flex-1 overflow-x-clip">
          <div className="container-page min-w-0 py-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
