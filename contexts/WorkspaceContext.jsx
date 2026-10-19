// contexts/WorkspaceContext.jsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

const WorkspaceContext = createContext(null);
const STORAGE_KEY = "tf:current-workspace";

const PLACEHOLDER_WORKSPACE = {
  id: null,
  name: "No workspace",
  slug: null,
  role: null,
  initials: "—",
  color: "bg-muted text-muted-foreground",
};

function buildWorkspaces(memberships) {
  return memberships.map((m) => {
    const name = m.workspaceName || "Workspace";
    return {
      id: m.workspaceId,
      name,
      slug: m.workspaceSlug,
      role: m.role,
      initials: name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      color:
        m.role === "owner"
          ? "bg-accent text-accent-foreground"
          : m.role === "admin"
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground",
    };
  });
}

export function WorkspaceProvider({ children }) {
  const { memberships, loading: authLoading, refresh: refreshAuth } = useAuth();
  const [currentWorkspace, setCurrentWorkspaceState] = useState(null);
  const [resolving, setResolving] = useState(true);

  const workspaces = useMemo(() => buildWorkspaces(memberships), [memberships]);

  // Restore from localStorage once auth has resolved.
  useEffect(() => {
    if (authLoading) return;
    if (typeof window === "undefined") {
      setResolving(false);
      return;
    }
    const savedId = window.localStorage.getItem(STORAGE_KEY);
    if (!savedId || workspaces.length === 0) {
      setResolving(false);
      return;
    }
    const match = workspaces.find((w) => w.id === savedId);
    if (match) setCurrentWorkspaceState(match);
    setResolving(false);
  }, [workspaces, authLoading]);

  // Pick a default if none was restored.
  useEffect(() => {
    if (authLoading) return;
    if (workspaces.length === 0) {
      setCurrentWorkspaceState(null);
      return;
    }
    setCurrentWorkspaceState((prev) => {
      if (prev && workspaces.some((w) => w.id === prev.id)) {
        const fresh = workspaces.find((w) => w.id === prev.id);
        if (
          fresh.name === prev.name &&
          fresh.role === prev.role &&
          fresh.slug === prev.slug
        ) {
          return prev;
        }
        return fresh;
      }
      return workspaces[0];
    });
  }, [authLoading, workspaces]);

  // Persist selection.
  useEffect(() => {
    if (authLoading) return;
    if (typeof window === "undefined") return;
    if (currentWorkspace?.id) {
      window.localStorage.setItem(STORAGE_KEY, currentWorkspace.id);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentWorkspace, authLoading]);

  const setCurrentWorkspace = useCallback((ws) => {
    setCurrentWorkspaceState(ws || null);
  }, []);

  // Force refresh of the workspace metadata (useful after updating name/slug)
  const refreshWorkspace = useCallback(async () => {
    await refreshAuth();
  }, [refreshAuth]);

  const hasWorkspace = workspaces.length > 0;
  const safeWorkspace = currentWorkspace || PLACEHOLDER_WORKSPACE;
  const workspaceId = currentWorkspace?.id || null;

  const loading = authLoading || resolving;

  const value = useMemo(
    () => ({
      workspaces,
      currentWorkspace: safeWorkspace,
      currentWorkspaceId: workspaceId,
      setCurrentWorkspace,
      refreshWorkspace,
      hasWorkspace,
      loading,
    }),
    [
      workspaces,
      safeWorkspace,
      workspaceId,
      setCurrentWorkspace,
      refreshWorkspace,
      hasWorkspace,
      loading,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx)
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}