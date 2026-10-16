// hooks/useProjects.js
"use client";

import { useMemo } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useApiQuery } from "./useApiQuery";
import { qs } from "@/lib/api";

export function useProjects(role, options = {}) {
  const { page = 1, pageSize = 50 } = options;
  const { currentWorkspaceId } = useWorkspace();

  const url = useMemo(() => {
    if (!currentWorkspaceId) return null;
    return `/api/${role}/projects${qs({ workspaceId: currentWorkspaceId, page, pageSize })}`;
  }, [role, currentWorkspaceId, page, pageSize]);

  const { data, loading, error, refresh } = useApiQuery(url, {
    skip: !url,
    deps: [url],
  });

  return {
    projects: data?.projects || [],
    total: data?.total || 0,
    loading,
    error,
    refresh,
  };
}