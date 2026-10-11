import { AppLink as Link } from "@/components/ui/AppLink";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";
import { RedirectIfAuthenticated } from "@/components/guards/RedirectIfAuthenticated";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function SignupPage() {
  useDocumentTitle("Create account");
  return (
    <RedirectIfAuthenticated>
      <AuthCard
        title="Create your account"
        subtitle="It takes a minute. You'll go straight to booking."
        footer={
          <span className="text-muted">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-ink hover:underline">
              Log in
            </Link>
          </span>
        }
      >
        <SignupForm />
      </AuthCard>
    </RedirectIfAuthenticated>
  );
}
