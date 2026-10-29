/** Line-art icons for the vehicle classes (bike, van, truck). Slug-keyed with a fallback. */
export function VehicleIcon({
  slug,
  className = "size-8",
}: {
  slug: string;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (slug.includes("bike")) {
    return (
      <svg {...common}>
        <circle cx="12" cy="34" r="7" />
        <circle cx="36" cy="34" r="7" />
        <path d="M12 34 22 18h9l4 16M22 18l-3-6h-5M31 18l5 16" />
        <path d="M27 12h8" />
      </svg>
    );
  }

  if (slug.includes("truck")) {
    return (
      <svg {...common}>
        <path d="M4 12h22v20H4zM26 18h9l7 7v7h-16z" />
        <circle cx="14" cy="36" r="4" />
        <circle cx="34" cy="36" r="4" />
        <path d="M4 32h6M22 32h4M38 32h4" />
      </svg>
    );
  }

  // van (default)
  return (
    <svg {...common}>
      <path d="M4 14h20v18H4zM24 18h8l8 8v6H24z" />
      <circle cx="14" cy="34" r="4" />
      <circle cx="34" cy="34" r="4" />
      <path d="M28 20h5l3 4h-8z" />
      <path d="M4 32h6M22 32h4M38 32h4" />
    </svg>
  );
}
