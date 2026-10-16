// hooks/useMembers.js
"use client";

import { useMemo } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useApiQuery } from "./useApiQuery";
import { qs } from "@/lib/api";

export function useMembers(role, { skip = false } = {}) {
  const { currentWorkspaceId, loading: wsLoading } = useWorkspace();

  const url = useMemo(() => {
    if (skip) return null;
    if (!currentWorkspaceId) return null;
    return `/api/${role}/team${qs({ workspaceId: currentWorkspaceId })}`;
  }, [role, currentWorkspaceId, skip]);

  const { data, loading, error, refresh } = useApiQuery(url, {
    skip: !url || skip,
    deps: [url],
  });

  return {
    members: data?.members || [],
    currentUserId: data?.currentUserId || null,
    currentRole: data?.currentRole || null,
    loading: skip ? false : wsLoading || loading,
    error,
    refresh,
  };
}