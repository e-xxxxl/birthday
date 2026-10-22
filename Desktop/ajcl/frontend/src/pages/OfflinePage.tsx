import { AppLink as Link } from "@/components/ui/AppLink";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function OfflinePage() {
  useDocumentTitle("Offline");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface px-4 text-center">
      <Logo href="/" />
      <div>
        <h1 className="mt-3 text-xl font-bold">You&apos;re offline</h1>
        <p className="mt-1 max-w-sm text-sm text-muted">
          We can&apos;t reach the network right now. Your booking data is safe — reconnect and try
          again.
        </p>
      </div>
      <div className="flex gap-2">
        <Button href="/">Retry</Button>
        <Link
          href="/dashboard"
          className="grid place-items-center px-3 text-sm font-semibold text-muted hover:text-ink"
        >
          My bookings
        </Link>
      </div>
    </div>
  );
}
