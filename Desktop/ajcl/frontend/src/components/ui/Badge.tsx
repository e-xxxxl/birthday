import { cn } from "@/lib/utils";
import { BOOKING_STATUS_META, PAYMENT_STATUS, type BookingStatus } from "@/config/booking";

type Tone = "neutral" | "info" | "progress" | "success" | "danger" | "warning";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-soft",
  info: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  progress: "bg-[var(--color-accent-soft)] text-[var(--color-accent-dark)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const meta = BOOKING_STATUS_META[status];
  return (
    <Badge tone={meta.tone}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {meta.label}
    </Badge>
  );
}

const paymentTone: Record<string, Tone> = {
  [PAYMENT_STATUS.paid]: "success",
  [PAYMENT_STATUS.pending]: "warning",
  [PAYMENT_STATUS.unpaid]: "neutral",
  [PAYMENT_STATUS.failed]: "danger",
  [PAYMENT_STATUS.refunded]: "info",
  [PAYMENT_STATUS.on_account]: "info",
};

export function PaymentBadge({ status }: { status: string }) {
  const text = status.replace(/_/g, " ");
  const label = text.charAt(0).toUpperCase() + text.slice(1);
  return <Badge tone={paymentTone[status] ?? "neutral"}>{label}</Badge>;
}
