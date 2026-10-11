
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
type Toast = { id: string; tone: ToastTone; title: string; description?: string };

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ tone: "success", title, description }),
      error: (title, description) => toast({ tone: "error", title, description }),
      info: (title, description) => toast({ tone: "info", title, description }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.tone === "error" ? 6000 : 4000);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.tone]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto w-full max-w-sm animate-fade-in-up overflow-hidden rounded-xl border bg-paper shadow-pop",
        toast.tone === "success" && "border-l-4 border-l-[var(--color-success)]",
        toast.tone === "error" && "border-l-4 border-l-[var(--color-danger)]",
        toast.tone === "info" && "border-l-4 border-l-[var(--color-info)]",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <span
          aria-hidden
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold text-paper",
            toast.tone === "success" && "bg-[var(--color-success)]",
            toast.tone === "error" && "bg-[var(--color-danger)]",
            toast.tone === "info" && "bg-[var(--color-info)]",
          )}
        >
          {toast.tone === "success" ? "✓" : toast.tone === "error" ? "!" : "i"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{toast.title}</p>
          {toast.description ? (
            <p className="mt-0.5 text-sm text-muted">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1 rounded p-1 text-muted transition hover:text-ink"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
