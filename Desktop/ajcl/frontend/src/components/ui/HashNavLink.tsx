import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  onNavigate?: () => void;
};

/**
 * A link to an in-page section (`/#services`, `/#pricing`, …). When you're
 * already on the target page it scrolls to the section directly (works on
 * repeat clicks, which a plain react-router <Link> wouldn't); otherwise it
 * routes to the page and `ScrollToTop` finishes the jump.
 */
export function HashNavLink({ href, onNavigate, children, ...rest }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const hashIndex = href.indexOf("#");
  const targetPath = (hashIndex === -1 ? href : href.slice(0, hashIndex)) || "/";
  const id = hashIndex === -1 ? "" : href.slice(hashIndex + 1);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onNavigate?.();
    if (!id || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (pathname === targetPath) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", href);
        return;
      }
    }
    navigate(href);
  }

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
