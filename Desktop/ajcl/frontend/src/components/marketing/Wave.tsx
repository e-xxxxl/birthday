import { cn } from "@/lib/utils";

/**
 * The curved edge at the bottom of a navy section: a white swell with an orange sweep behind it,
 * echoing the swoosh in the logo. Place it at the bottom of a `relative` navy section.
 */
export function Wave({ className, to = "white" }: { className?: string; to?: "white" | "surface" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-x-0 bottom-[-1px] block h-[56px] w-full md:h-[96px]", className)}
    >
      <path d="M0 96 C 380 24, 860 10, 1440 70 L1440 120 L0 120 Z" fill="var(--color-accent)" />
      <path d="M0 112 C 420 44, 900 34, 1440 92 L1440 120 L0 120 Z" fill={to === "white" ? "#ffffff" : "var(--color-surface)"} />
    </svg>
  );
}
