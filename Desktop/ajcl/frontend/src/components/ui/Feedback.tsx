import { cn } from "@/lib/utils";

/* ── Spinner ────────────────────────────────────────────────────────────── */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
    />
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted" role="status">
      <Spinner className="size-5 text-ink" />
      {label}
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-surface-2", className)} />;
}

/* ── Alert ──────────────────────────────────────────────────────────────── */
type AlertTone = "info" | "success" | "warning" | "danger";
const alertTone: Record<AlertTone, string> = {
  info: "border-[var(--color-info)]/25 bg-[var(--color-info-soft)] text-[var(--color-info)]",
  success: "border-[var(--color-success)]/25 bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warning: "border-[var(--color-warning)]/25 bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  danger: "border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", alertTone[tone], className)}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title && "mt-0.5", "text-ink-soft")}>{children}</div> : null}
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-sm border border-dashed border-line-strong bg-surface/50 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-3 text-3xl opacity-70">{icon}</div> : null}
      <p className="text-base font-bold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
