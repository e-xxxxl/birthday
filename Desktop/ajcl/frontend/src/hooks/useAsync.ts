import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "@/lib/http";

type State<T> = { data?: T; error?: string; loading: boolean };

/** Run an async fetch on mount + when `deps` change. Exposes `reload()`. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): State<T> & { reload: () => void } {
  const [state, setState] = useState<State<T>>({ loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: undefined }));
    fnRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          error: err instanceof HttpError ? err.message : "Something went wrong. Please try again.",
          loading: false,
        });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const cancel = reload();
    return cancel;
  }, [reload]);

  return { ...state, reload };
}
