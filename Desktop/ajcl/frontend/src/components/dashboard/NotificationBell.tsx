
import { useCallback, useEffect, useRef, useState } from "react";
import { AppLink as Link } from "@/components/ui/AppLink";
import { http } from "@/lib/http";
import { cn, timeAgo } from "@/lib/utils";
import type { NotificationDTO } from "@/types";

export function NotificationBell({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [unread, setUnread] = useState(0);
  const [panelTop, setPanelTop] = useState(64);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await http.get<{ notifications: NotificationDTO[]; unread: number }>(
        "/api/notifications?limit=15",
      );
      setItems(res.notifications);
      setUnread(res.unread);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await http.post("/api/notifications/read", { all: true });
    } catch {
      void load();
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) {
            void load();
            // Sit below the whole sticky header (which may have a nav row).
            const header = btnRef.current?.closest("header");
            const r = (header ?? btnRef.current)?.getBoundingClientRect();
            if (r) setPanelTop(Math.round(r.bottom + 8));
          }
        }}
        className={cn(
          "relative grid size-10 place-items-center rounded-sm border transition",
          variant === "dark"
            ? "border-paper/25 text-paper hover:bg-paper/10"
            : "border-line-strong text-ink hover:bg-surface",
        )}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a2 2 0 0 0 3.4 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-sm bg-[var(--color-danger)] px-1 text-[10px] font-bold text-paper">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          style={{ "--nb-top": `${panelTop}px` } as React.CSSProperties}
          className={cn(
            "z-50 overflow-hidden rounded-2xl border border-line bg-paper shadow-card shadow-pop",
            // Mobile: pinned to the viewport just below the bell, full width minus a margin.
            "fixed inset-x-3 top-[var(--nb-top)]",
            // sm+: a normal dropdown anchored to the bell.
            "sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80",
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-bold">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-ink-soft hover:text-ink"
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-[65vh] overflow-y-auto sm:max-h-96">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">You&apos;re all caught up.</p>
            ) : (
              items.map((n) => {
                const body = (
                  <div
                    className={cn(
                      "flex gap-3 px-4 py-3 text-sm",
                      !n.read && "bg-accent-soft/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-sm",
                        n.read ? "bg-line-strong" : "bg-accent",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{n.title}</p>
                      <p className="text-muted">{n.body}</p>
                      <p className="mt-0.5 text-xs text-muted/80">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );
                return n.href ? (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-line last:border-0 hover:bg-surface"
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={n.id} className="border-b border-line last:border-0">
                    {body}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
