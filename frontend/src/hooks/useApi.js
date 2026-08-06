import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Small data-fetching hook: returns { data, loading, error, refresh }.
 * `fn` is called whenever `deps` change or refresh() is invoked.
 *
 * `loading` is only true while there is no data yet. During refreshes the
 * previous data stays visible (no flicker); pages can check `refreshing`
 * if they want to show a subtle indicator instead of a full spinner.
 */
export function useApi(fn, deps = []) {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelled = false;
    const hasData = data !== undefined;
    if (hasData) setRefreshing(true);
    else setLoading(true);
    setError(null);
    fnRef
      .current()
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, refreshing, error, refresh };
}
