import { Outlet } from "react-router-dom";
import { AppLink as Link } from "@/components/ui/AppLink";
import { Logo } from "@/components/ui/Logo";
import { site } from "@/config/site";

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <header className="container-page flex h-16 items-center">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <footer className="container-page py-6 text-center text-xs text-muted">
        <Link href="/" className="hover:text-ink">
          ← Back to {site.name}
        </Link>
      </footer>
    </div>
  );
}
