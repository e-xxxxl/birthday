import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle ? <p className="mt-1.5 text-sm text-muted">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
      {footer ? <div className="mt-6 border-t border-line pt-5 text-center text-sm">{footer}</div> : null}
    </Card>
  );
}

export function formErrorsFrom(details?: Record<string, string[]>): Record<string, string> {
  if (!details) return {};
  return Object.fromEntries(
    Object.entries(details).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]),
  );
}
