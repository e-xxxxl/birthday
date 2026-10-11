
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { useAuth } from "@/components/providers/AuthProvider";
import { http, HttpError } from "@/lib/http";
import { loginSchema } from "@/lib/validation/auth";
import type { SessionUser } from "@/types";

export function AdminLoginForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { applyAuth } = useAuth();
  const next = params.get("next") || "/admin";

  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ ...values, remember: true });
    if (!parsed.success) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await http.post<{ token: string; user: SessionUser }>(
        "/api/admin/login",
        parsed.data,
      );
      applyAuth(res);
      navigate(next);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Sign in failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Input
        label="Email"
        type="email"
        required
        autoComplete="email"
        value={values.email}
        onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
      />
      <PasswordInput
        label="Password"
        required
        autoComplete="current-password"
        value={values.password}
        onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
      />
      <Button type="submit" fullWidth loading={loading}>
        Sign in
      </Button>
    </form>
  );
}
