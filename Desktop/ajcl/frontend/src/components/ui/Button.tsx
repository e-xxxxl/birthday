import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold whitespace-nowrap transition-all duration-150 ease-[var(--ease-out-soft)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-[#2b2b2b] shadow-sm",
  accent: "bg-accent text-ink hover:bg-[var(--color-accent-dark)] shadow-sm",
  secondary: "bg-paper text-ink border border-line-strong hover:border-ink hover:bg-surface",
  ghost: "bg-transparent text-ink hover:bg-surface",
  danger: "bg-[var(--color-danger)] text-paper hover:bg-[#a51919]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
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

export const Button = forwardRef<HTMLButtonElement & HTMLAnchorElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", loading, fullWidth, className, children, ...props },
    ref,
  ) {
    const classes = cn(
      base,
      variants[variant],
      sizes[size],
      fullWidth && "w-full",
      className,
    );

    if ("href" in props && props.href !== undefined) {
      const { href, ...rest } = props as ButtonAsLink;
      const external = /^(https?:|mailto:|tel:)/.test(href) || href.startsWith("#");
      if (external) {
        return (
          <a href={href} ref={ref} className={classes} {...rest}>
            {loading ? <Spinner /> : null}
            {children}
          </a>
        );
      }
      return (
        <Link to={href} ref={ref} className={classes} {...rest}>
          {loading ? <Spinner /> : null}
          {children}
        </Link>
      );
    }

    const { disabled, ...rest } = props as ButtonAsButton;
    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...rest}>
        {loading ? <Spinner /> : null}
        {children}
      </button>
    );
  },
);
