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
    <Card className="rounded-[2rem] border-0 p-7 sm:p-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p> : null}
      <div className="mt-7">{children}</div>
      {footer ? <div className="mt-7 border-t border-line pt-5 text-center text-sm">{footer}</div> : null}
    </Card>
  );
}

export function formErrorsFrom(details?: Record<string, string[]>): Record<string, string> {
  if (!details) return {};
  return Object.fromEntries(
    Object.entries(details).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]),
  );
}
