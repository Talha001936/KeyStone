// contexts/AuthContext.jsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { api, ApiError } from "@/lib/api";

const AuthContext = createContext(null);
const TAB_KEY = "tf:tab-alive";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const initialCheckDoneRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ---------------- Core refresh ---------------- */
  const refresh = useCallback(async () => {
    try {
      const data = await api.get(api.auth("/me"));
      if (!mountedRef.current) return null;
      setUser(data.user || null);
      setMemberships(data.memberships || []);
      setStatus(data.user ? "authenticated" : "unauthenticated");
      setError(null);
      return data;
    } catch (err) {
      if (!mountedRef.current) return null;
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setMemberships([]);
        setStatus("unauthenticated");
        setError(null);
      } else {
        setUser(null);
        setMemberships([]);
        setStatus("error");
        setError(err?.message || "Failed to load session.");
      }
      return null;
    }
  }, []);

  /* ---------------- Initial mount: session check + refresh ---------------- */
  useEffect(() => {
    if (initialCheckDoneRef.current) return;
    initialCheckDoneRef.current = true;

    let cancelled = false;

    (async () => {
      if (typeof window !== "undefined") {
        const alive = window.sessionStorage.getItem(TAB_KEY);
        if (!alive) {
          // Fresh tab in this session → mark it and clear any stale cookie.
          window.sessionStorage.setItem(TAB_KEY, "1");
          try {
            const res = await fetch("/api/auth/me", {
              method: "GET",
              credentials: "same-origin",
              cache: "no-store",
            });
            if (res.ok) {
              await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "same-origin",
              });
            }
          } catch {
            /* fall through to refresh */
          }
        }
      }

      if (cancelled || !mountedRef.current) return;

      // Always resolve the auth state, on every mount.
      await refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  /* ---------------- Session-expired handler ---------------- */
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setMemberships([]);
      setStatus("unauthenticated");
    };
    window.addEventListener("tf:session-expired", onExpired);
    return () => window.removeEventListener("tf:session-expired", onExpired);
  }, []);

  /* ---------------- Actions ---------------- */
  const login = useCallback(
    async (email, password) => {
      const data = await api.post(api.auth("/login"), { email, password });
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(TAB_KEY, "1");
      }
      await refresh();
      return data;
    },
    [refresh]
  );

  const register = useCallback(
    async (name, email, password) => {
      const data = await api.post(api.auth("/register"), {
        name,
        email,
        password,
      });
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(TAB_KEY, "1");
      }
      await refresh();
      return data;
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    try {
      await api.post(api.auth("/logout"));
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(TAB_KEY);
    }
    setUser(null);
    setMemberships([]);
    setStatus("unauthenticated");
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        memberships,
        loading: status === "loading",
        status,
        error,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}