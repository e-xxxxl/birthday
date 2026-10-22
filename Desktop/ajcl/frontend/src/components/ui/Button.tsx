import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent" | "navy" | "light" | "outline-light";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn inline-flex items-center justify-center gap-2.5 rounded-xl font-bold whitespace-nowrap transition-all duration-200 ease-[var(--ease-out-soft)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white shadow-sm hover:bg-accent-dark hover:shadow-md",
  accent: "bg-accent text-white shadow-sm hover:bg-accent-dark hover:shadow-md",
  navy: "bg-ink text-white shadow-sm hover:bg-navy-deep",
  secondary: "border-[1.5px] border-line-strong bg-paper text-ink hover:border-ink hover:bg-surface",
  ghost: "bg-transparent text-ink hover:bg-surface-2",
  danger: "bg-[var(--color-danger)] text-white hover:bg-[#a51919]",
  /* On photographs and navy */
  light: "bg-paper text-ink shadow-sm hover:bg-accent hover:text-white",
  "outline-light": "border-[1.5px] border-white/60 bg-transparent text-white hover:border-white hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-7 text-[0.95rem]",
  lg: "h-14 px-8 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  /** A small arrow tile at the end of the label. */
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const Spinner = () => (
  <span
    aria-hidden
    className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
  />
);

function ArrowTile({ variant }: { variant: Variant }) {
  const onPhoto = variant === "primary" || variant === "accent" || variant === "navy" || variant === "danger";
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-lg transition-transform duration-200 group-hover/btn:translate-x-0.5",
        onPhoto ? "bg-white text-ink" : "bg-ink text-white",
      )}
    >
      <Icon name="arrow" className="size-4" />
    </span>
  );
}

export const Button = forwardRef<HTMLButtonElement & HTMLAnchorElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", loading, fullWidth, arrow, className, children, ...props },
    ref,
  ) {
    const classes = cn(base, variants[variant], sizes[size], arrow && "pr-2.5", fullWidth && "w-full", className);
    const content = (
      <>
        {loading ? <Spinner /> : null}
        {children}
        {arrow ? <ArrowTile variant={variant} /> : null}
      </>
    );

    if ("href" in props && props.href !== undefined) {
      const { href, ...rest } = props as ButtonAsLink;
      const external = /^(https?:|mailto:|tel:)/.test(href) || href.startsWith("#");
      if (external) {
        return (
          <a href={href} ref={ref} className={classes} {...rest}>
            {content}
          </a>
        );
      }
      return (
        <Link to={href} ref={ref} className={classes} {...rest}>
          {content}
        </Link>
      );
    }

    const { disabled, ...rest } = props as ButtonAsButton;
    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...rest}>
        {content}
      </button>
    );
  },
);
