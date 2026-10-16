"use client";

import { useApiQuery } from "./useApiQuery";

export function useTask(role, slug, taskNumber) {
  const url =
    slug && taskNumber
      ? `/api/${role}/projects/${slug}/tasks/${taskNumber}`
      : null;

  const { data, loading, error, refresh } = useApiQuery(url, {
    skip: !url,
    deps: [role, slug, taskNumber],
  });

  return {
    task: data?.task || null,
    role: data?.role || null,
    isAssignee: data?.isAssignee ?? false,
    loading,
    error,
    refresh,
  };
}