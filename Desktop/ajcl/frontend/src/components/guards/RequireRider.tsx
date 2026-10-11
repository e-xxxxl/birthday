import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/providers/AuthProvider";
import { LoadingBlock } from "@/components/ui/Feedback";

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

  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "customer") return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
