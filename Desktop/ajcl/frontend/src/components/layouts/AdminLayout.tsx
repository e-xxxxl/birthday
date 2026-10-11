import { Outlet } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { RequireAdmin } from "@/components/guards/RequireAdmin";
import { AdminNav } from "@/components/admin/AdminNav";
import { AccountMenu } from "@/components/dashboard/AccountMenu";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

export function AdminLayout() {
  return (
    <RequireAdmin>
      <div className="flex min-h-dvh flex-col bg-surface text-ink">
        <header className="sticky top-0 z-40 border-b border-line bg-ink text-paper">
          <div className="container-page flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Logo href="/admin" variant="light" />
              <span className="hidden rounded-full bg-paper/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-paper/80 sm:block">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell variant="dark" />
              <AccountMenu />
            </div>
          </div>
          <AdminNav />
        </header>
        <main className="flex-1">
          <div className="container-page py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </RequireAdmin>
  );
}
