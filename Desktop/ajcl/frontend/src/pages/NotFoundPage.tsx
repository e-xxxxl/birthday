import { AppLink as Link } from "@/components/ui/AppLink";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface px-4 text-center">
      <Logo href="/" />
      <div>
        <p className="text-6xl font-bold">404</p>
        <h1 className="mt-2 text-xl font-bold">Page not found</h1>
        <p className="mt-1 text-sm text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <div className="flex gap-2">
        <Button href="/">Back home</Button>
        <Button href="/dashboard" variant="secondary">
          My dashboard
        </Button>
      </div>
      <Link href="/contact" className="text-xs font-semibold text-muted hover:text-ink">
        Contact support
      </Link>
    </div>
  );
}
