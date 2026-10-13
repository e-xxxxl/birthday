
import { AppLink as Link } from "@/components/ui/AppLink";
import { cn } from "@/lib/utils";
import { BOOKING_STATUS_FLOW, BOOKING_STATUS_META } from "@/config/booking";

const options = ["all", ...BOOKING_STATUS_FLOW, "cancelled", "returned"] as const;

export function BookingsFilter({ current }: { current: string }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {options.map((opt) => {
        const label =
          opt === "all"
            ? "All"
            : BOOKING_STATUS_META[opt as keyof typeof BOOKING_STATUS_META].label;
        const active = current === opt;
        return (
          <Link
            key={opt}
            href={opt === "all" ? "/dashboard/bookings" : `/dashboard/bookings?status=${opt}`}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
              active
                ? "border-ink bg-ink text-paper"
                : "border-line-strong text-ink-soft hover:border-ink",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
