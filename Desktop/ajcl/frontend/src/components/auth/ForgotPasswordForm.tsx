
import { useState } from "react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { http, HttpError } from "@/lib/http";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ message: string; devResetUrl?: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await http.post<{ message: string; devResetUrl?: string }>(
        "/api/auth/forgot-password",
        parsed.data,
      );
      setDone(res);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Alert tone="success">{done.message}</Alert>
        {done.devResetUrl ? (
          <Alert tone="info" title="Development mode">
            Email delivery isn&apos;t configured. Use this link to reset:
            <br />
            <a href={done.devResetUrl} className="mt-1 block break-all font-semibold underline">
              {done.devResetUrl}
            </a>
          </Alert>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Input
        label="Email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" fullWidth loading={loading}>
        Send reset link
      </Button>
    </form>
  );
}
