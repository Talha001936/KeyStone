// hooks/useActivities.js
"use client";

import { useMemo } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useApiQuery } from "./useApiQuery";
import { qs } from "@/lib/api";

export function useActivities(role, options = {}) {
  const { filters = {}, page = 1, pageSize = 20 } = options;
  const { currentWorkspaceId } = useWorkspace();

  const url = useMemo(() => {
    if (!currentWorkspaceId) return null;
    return `/api/${role}/activities${qs({
      workspaceId: currentWorkspaceId,
      page,
      pageSize,
      ...filters,
    })}`;
  }, [role, currentWorkspaceId, page, pageSize, JSON.stringify(filters)]);

  const { data, loading, error, refresh } = useApiQuery(url, {
    skip: !url,
    deps: [url],
  });

  return {
    activities: data?.activities || [],
    total: data?.total || 0,
    page: data?.page || page,
    pageSize: data?.pageSize || pageSize,
    loading,
    error,
    refresh,
  };
}