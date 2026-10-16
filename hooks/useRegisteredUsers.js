// hooks/useRegisteredUsers.js
"use client";

import { useMemo } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useApiQuery } from "./useApiQuery";
import { qs } from "@/lib/api";

export function useRegisteredUsers(role, { q = "" } = {}) {
  const { currentWorkspaceId } = useWorkspace();

  const url = useMemo(() => {
    if (!currentWorkspaceId) return null;
    return `/api/${role}/team/registered${qs({
      workspaceId: currentWorkspaceId,
      q,
    })}`;
  }, [role, currentWorkspaceId, q]);

  const { data, loading, error, refresh } = useApiQuery(url, {
    skip: !url,
    deps: [url],
  });

  return {
    users: data?.users || [],
    loading,
    error,
    refresh,
  };
}