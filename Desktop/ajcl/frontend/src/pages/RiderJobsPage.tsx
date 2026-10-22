import { useState } from "react";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/Feedback";
import { RiderJobCard } from "@/components/rider/RiderJobCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { http } from "@/lib/http";
import { cn } from "@/lib/utils";
import type { RiderJobDTO } from "@/types";

const TABS = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
] as const;

export function RiderJobsPage() {
  useDocumentTitle("My deliveries");
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("active");

  const { data, loading, error, reload } = useAsync(
    () => http.get<{ jobs: RiderJobDTO[] }>("/api/rider/jobs"),
    [],
  );

  const jobs = data?.jobs ?? [];
  const active = jobs.filter((j) => j.status === "driver_assigned" || j.status === "in_transit");
  const completed = jobs.filter((j) => j.status === "delivered" || j.status === "returned");
  const list = tab === "active" ? active : completed;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">Welcome back, {user?.firstName}</h1>
        <p className="mt-1 text-sm text-muted">Here are the deliveries assigned to you.</p>
      </div>

      {error ? (
        <Alert tone="danger">
          {error}{" "}
          <button type="button" onClick={reload} className="font-semibold underline">
            Retry
          </button>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0 rounded-2xl border border-line bg-paper shadow-card p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">
            Active deliveries
          </p>
          <p className="mt-1.5 text-xl font-bold leading-tight font-mono tabular-nums sm:mt-2 sm:text-2xl">
            {active.length}
          </p>
        </div>
        <div className="min-w-0 rounded-2xl border border-line bg-paper shadow-card p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">
            Completed
          </p>
          <p className="mt-1.5 text-xl font-bold leading-tight font-mono tabular-nums sm:mt-2 sm:text-2xl">
            {completed.length}
          </p>
        </div>
      </div>

      {loading && jobs.length === 0 ? (
        <LoadingBlock label="Loading your deliveries…" />
      ) : (
        <section>
          <div className="flex items-center gap-1 border-b border-line">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition",
                  tab === t.key ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {t.label}
                <span className="ml-1.5 rounded-sm bg-surface-2 px-1.5 text-xs">
                  {t.key === "active" ? active.length : completed.length}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5">
            {list.length === 0 ? (
              <EmptyState
                title={tab === "active" ? "No deliveries assigned yet" : "No completed deliveries yet"}
                description={
                  tab === "active"
                    ? "New jobs assigned to you by the admin will show up here."
                    : "Deliveries you've completed will show up here."
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {list.map((j) => (
                  <RiderJobCard key={j.id} booking={j} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
