import { forwardRef, type AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";

/**
 * Drop-in replacement for `next/link` that keeps the `href` prop name.
 * Internal paths go through react-router; external / protocol links render a
 * plain anchor.
 */
type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

export const AppLink = forwardRef<HTMLAnchorElement, Props>(function AppLink(
  { href, children, ...rest },
  ref,
) {
  const isExternal = /^(https?:|mailto:|tel:|\/\/)/i.test(href);
  if (isExternal) {
    return (
      <a ref={ref} href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link ref={ref} to={href} {...rest}>
      {children}
    </Link>
  );
});
