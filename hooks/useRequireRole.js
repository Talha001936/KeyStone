// hooks/useRequireRole.js
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function useRequireRole(role) {
  const router = useRouter();
  const { status, loading: authLoading } = useAuth();
  const {
    hasWorkspace,
    currentWorkspace,
    loading: wsLoading,
  } = useWorkspace();

  const loading = authLoading || wsLoading;
  const workspaceRole = currentWorkspace?.role || null;

  const isUnauthenticated = status === "unauthenticated";
  const isError = status === "error";
  const isAuthenticated = status === "authenticated";

  const roleMismatch =
    !loading &&
    isAuthenticated &&
    hasWorkspace &&
    !!workspaceRole &&
    workspaceRole !== role;

  const roleMismatchRef = useRef(roleMismatch);
  roleMismatchRef.current = roleMismatch;
  const workspaceRoleRef = useRef(workspaceRole);
  workspaceRoleRef.current = workspaceRole;

  /* --- Unauthenticated → login --- */
  useEffect(() => {
    if (loading) return;
    if (!isUnauthenticated) return;
    const next =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "";
    router.replace(
      `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`
    );
  }, [loading, isUnauthenticated, router]);

  /* --- Role mismatch → own dashboard (debounced) --- */
  useEffect(() => {
    if (loading) return;
    if (!roleMismatch) return;
    const target = workspaceRole;
    if (!target) return;

    const timer = setTimeout(() => {
      if (!roleMismatchRef.current) return;
      const current = workspaceRoleRef.current;
      if (!current || current === role) return;
      router.replace(`/${current}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [loading, roleMismatch, workspaceRole, role, router]);

  const ready =
    !loading &&
    isAuthenticated &&
    hasWorkspace &&
    !!workspaceRole &&
    !roleMismatch;

  return {
    ready,
    loading,
    isError,
    isUnauthenticated,
    noWorkspace: !loading && isAuthenticated && !hasWorkspace,
    roleMismatch,
  };
}