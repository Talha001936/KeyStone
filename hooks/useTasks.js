// hooks/useTasks.js
"use client";

import { useMemo } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useApiQuery } from "./useApiQuery";
import { qs } from "@/lib/api";

export function useTasks(role, options = {}) {
  const { filters = {}, page = 1, pageSize = 20 } = options;
  const { currentWorkspaceId } = useWorkspace();

  const url = useMemo(() => {
    if (!currentWorkspaceId) return null;
    const query = qs({
      workspaceId: currentWorkspaceId,
      page,
      pageSize,
      ...filters,
    });
    return `/api/${role}/tasks${query}`;
  }, [role, currentWorkspaceId, page, pageSize, JSON.stringify(filters)]);

  const { data, loading, error, refresh } = useApiQuery(url, {
    skip: !url,
    deps: [url],
  });

  return {
    tasks: data?.tasks || [],
    total: data?.total || 0,
    page: data?.page || page,
    pageSize: data?.pageSize || pageSize,
    loading,
    error,
    refresh,
  };
}