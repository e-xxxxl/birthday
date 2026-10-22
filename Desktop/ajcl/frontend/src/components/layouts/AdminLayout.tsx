import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { RequireAdmin } from "@/components/guards/RequireAdmin";
import { AdminNav } from "@/components/admin/AdminNav";
import { AccountMenu } from "@/components/dashboard/AccountMenu";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { useAuth } from "@/components/providers/AuthProvider";
import { WalletBanner } from "@/components/admin/ShippingSummary";

export function AdminLayout() {
  return (
    <RequireAdmin>
      <AdminShell />
    </RequireAdmin>
  );
}

function AdminShell() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  // An Office Admin only works the shipments desk.
  if (user?.role === "office_admin" && !pathname.startsWith("/admin/shipments")) {
    return <Navigate to="/admin/shipments" replace />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-ink text-paper">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo href={user?.role === "office_admin" ? "/admin/shipments" : "/admin"} variant="light" />
            <span className="hidden rounded-sm bg-paper/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-paper/80 sm:block">
              {user?.role === "office_admin" ? "Office" : "Admin"}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell variant="dark" />
            <AccountMenu />
          </div>
        </div>
        <AdminNav />
      </header>
      <WalletBanner />
      <main className="flex-1">
        <div className="container-page py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
