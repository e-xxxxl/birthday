import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/providers/AuthProvider";
import { LoadingBlock } from "@/components/ui/Feedback";
import { isStaff, homeFor } from "@/lib/roles";

/** Gate the admin area. Unauthenticated → /admin/login; non-admins → /dashboard. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-surface">
        <LoadingBlock label="Loading…" />
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?next=${next}`} replace />;
  }

  // Office Admins work in the same area (limited to the shipments desk by the layout).
  if (!isStaff(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  return <>{children}</>;
}
