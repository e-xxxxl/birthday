import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * On navigation: scroll to the `#hash` target section if there is one, otherwise
 * scroll to the top. SPAs don't do either for us. The sticky-header offset is
 * handled by `scroll-padding-top` on <html> in index.css.
 */
export function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      // The target section may not be painted yet when arriving from another
      // route — retry for up to ~1s.
      let tries = 0;
      const jump = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (tries++ < 12) window.setTimeout(jump, 80);
      };
      jump();
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, hash, key]);

  return null;
}
