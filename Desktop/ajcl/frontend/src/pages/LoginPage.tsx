import { AppLink as Link } from "@/components/ui/AppLink";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { RedirectIfAuthenticated } from "@/components/guards/RedirectIfAuthenticated";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function LoginPage() {
  useDocumentTitle("Log in");
  return (
    <RedirectIfAuthenticated>
      <AuthCard
        title="Welcome back"
        subtitle="Log in to book a delivery and track your orders."
        footer={
          <span className="text-muted">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-ink hover:underline">
              Create an account
            </Link>
          </span>
        }
      >
        <LoginForm />
      </AuthCard>
    </RedirectIfAuthenticated>
  );
}
