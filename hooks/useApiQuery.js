// hooks/useApiQuery.js
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, qs } from "@/lib/api";


export function useApiQuery(url, { deps = [], skip = false, transform } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const abortRef = useRef(null);
  const lastUrlRef = useRef(null);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (skip || !url) {
      setLoading(false);
      return;
    }

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastUrlRef.current = url;

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get(url, { signal: controller.signal })
      .then((raw) => {
        if (cancelled || lastUrlRef.current !== url) return;
        setData(transform ? transform(raw) : raw);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === "ABORTED") return;
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, skip, reloadKey, ...deps]);

  return { data, loading, error, refresh };
}

export { qs };