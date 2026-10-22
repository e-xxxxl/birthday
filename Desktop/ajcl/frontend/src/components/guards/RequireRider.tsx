import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/providers/AuthProvider";
import { LoadingBlock } from "@/components/ui/Feedback";
import { isStaff, homeFor } from "@/lib/roles";

/** Gate the rider area. Unauthenticated → /rider/login; non-riders → their own home. */
export function RequireRider({ children }: { children: ReactNode }) {
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
    return <Navigate to={`/rider/login?next=${next}`} replace />;
  }

  if (isStaff(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  if (user.role === "customer") return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
