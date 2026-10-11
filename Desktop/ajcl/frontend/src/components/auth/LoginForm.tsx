
import { useState } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { formErrorsFrom } from "@/components/auth/AuthCard";
import { loginSchema } from "@/lib/validation/auth";
import { HttpError } from "@/lib/http";

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const next = params.get("next") || "/dashboard";

  const [values, setValues] = useState({ email: "", password: "", remember: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(formErrorsFrom(parsed.error.flatten().fieldErrors as Record<string, string[]>));
      return;
    }

    setLoading(true);
    try {
      const user = await login(parsed.data);
      toast.success("Logged in", `Welcome back, ${user.firstName}.`);
      navigate(user.role === "admin" ? "/admin" : next);
    } catch (err) {
      if (err instanceof HttpError) {
        setFormError(err.message);
        setErrors(formErrorsFrom(err.details));
      } else {
        setFormError("Could not log you in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError ? <Alert tone="danger">{formError}</Alert> : null}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={values.email}
        onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        error={errors.email}
      />
      <PasswordInput
        label="Password"
        autoComplete="current-password"
        required
        value={values.password}
        onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
        error={errors.password}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={values.remember}
            onChange={(e) => setValues((v) => ({ ...v, remember: e.target.checked }))}
            className="size-4 rounded border-line-strong accent-[var(--color-ink)]"
          />
          Remember me
        </label>
        <Link href="/forgot-password" className="text-sm font-semibold text-ink hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth loading={loading}>
        Log in
      </Button>
    </form>
  );
}
