// hooks/useActivityStream.js
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const MAX_BACKOFF = 30_000;


export function useActivityStream(role, onActivity) {
  const { currentWorkspaceId } = useWorkspace();
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);
  const retryRef = useRef(0);
  const retryTimerRef = useRef(null);
  const pollingRef = useRef(null);
  const handlerRef = useRef(onActivity);
  const sinceRef = useRef(new Date().toISOString());

  useEffect(() => {
    handlerRef.current = onActivity;
  }, [onActivity]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current || !currentWorkspaceId) return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/${role}/activities?workspaceId=${currentWorkspaceId}&pageSize=20`,
          { credentials: "same-origin" }
        );
        if (!res.ok) return;
        const data = await res.json();
        const activities = data.activities || [];
        for (const a of activities) {
          if (new Date(a.createdAt) > new Date(sinceRef.current)) {
            sinceRef.current = a.createdAt;
            handlerRef.current?.(a);
          }
        }
      } catch {
        /* silent */
      }
    }, 15_000);
  }, [role, currentWorkspaceId]);

  useEffect(() => {
    if (!currentWorkspaceId) return;
    if (typeof window === "undefined") return;
    if (typeof EventSource === "undefined") {
      startPolling();
      return stopPolling;
    }

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const url = `/api/${role}/activities/stream?workspaceId=${currentWorkspaceId}&since=${encodeURIComponent(
        sinceRef.current
      )}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener("hello", () => {
        setConnected(true);
        retryRef.current = 0;
      });

      es.addEventListener("activity", (e) => {
        try {
          const a = JSON.parse(e.data);
          if (a.createdAt) sinceRef.current = a.createdAt;
          handlerRef.current?.(a);
        } catch {}
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        esRef.current = null;
        if (cancelled) return;

        retryRef.current += 1;
        const delay = Math.min(
          MAX_BACKOFF,
          1000 * Math.pow(2, Math.min(retryRef.current, 5))
        );

        if (retryRef.current >= 3) startPolling();

        retryTimerRef.current = setTimeout(() => {
          if (!cancelled) connect();
        }, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      esRef.current?.close();
      esRef.current = null;
      stopPolling();
      setConnected(false);
    };
  }, [role, currentWorkspaceId, startPolling, stopPolling]);

  return { connected };
}