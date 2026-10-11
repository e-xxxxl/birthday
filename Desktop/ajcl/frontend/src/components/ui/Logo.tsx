import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { site } from "@/config/site";

/**
 * AJ Courier & Logistics wordmark — the brand lockup from /logo.png.
 * `className` controls the height (default h-10); width scales automatically.
 * `variant="light"` renders a white silhouette for dark backgrounds.
 */
export function Logo({
  className,
  href = "/",
  variant = "dark",
}: {
  className?: string;
  href?: string | null;
  variant?: "dark" | "light";
}) {
  const img = (
    <img
      src="/logo.png"
      alt={site.name}
      className={cn(
        "w-auto object-contain",
        className ?? "h-11 sm:h-12",
        variant === "light" && "[filter:brightness(0)_invert(1)]",
      )}
    />
  );

  if (href === null) return img;
  return (
    <Link to={href} aria-label={site.name} className="inline-flex shrink-0 items-center">
      {img}
    </Link>
  );
}
