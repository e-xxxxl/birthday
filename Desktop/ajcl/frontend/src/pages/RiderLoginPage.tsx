import { Navigate } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { RiderLoginForm } from "@/components/rider/RiderLoginForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function RiderLoginPage() {
  useDocumentTitle("Rider sign in");
  const { user, loading } = useAuth();

  if (!loading && user?.role === "rider") return <Navigate to="/rider" replace />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo href={null} variant="light" />
        </div>
        <div className="rounded-2xl bg-paper p-6 shadow-pop sm:p-8">
          <h1 className="text-xl font-bold">Rider sign in</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to see your deliveries and confirm pickups &amp; drop-offs.
          </p>
          <div className="mt-6">
            <RiderLoginForm />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-paper/50">
          Not a rider?{" "}
          <a href="/login" className="underline hover:text-paper">
            Customer login
          </a>
        </p>
      </div>
    </div>
  );
}
