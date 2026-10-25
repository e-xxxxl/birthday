import { useEffect } from "react";
import { site } from "@/config/site";

/** Set `document.title`, restoring the previous value on unmount. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${site.name}` : `${site.name} | Delivery and shipping from Lagos`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
