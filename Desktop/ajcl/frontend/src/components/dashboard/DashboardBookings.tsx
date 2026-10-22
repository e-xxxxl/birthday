
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { EmptyState } from "@/components/ui/Feedback";
import type { BookingDTO } from "@/types";

type Buckets = {
  active: BookingDTO[];
  pending: BookingDTO[];
  completed: BookingDTO[];
  cancelled: BookingDTO[];
  returned: BookingDTO[];
};

const TABS = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returned", label: "Returned" },
] as const;

export function DashboardBookings({ buckets }: { buckets: Buckets }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>(
    buckets.active.length > 0 ? "active" : "completed",
  );
  const list = buckets[tab];

  return (
    <section>
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition",
              tab === t.key
                ? "border-ink text-ink"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
            <span className="ml-1.5 rounded-sm bg-surface-2 px-1.5 text-xs">
              {buckets[t.key].length}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        {list.length === 0 ? (
          <EmptyState title={`No ${tab} bookings`} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
