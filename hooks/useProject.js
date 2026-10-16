"use client";

import { useApiQuery } from "./useApiQuery";

export function useProject(role, slug) {
  const url = slug ? `/api/${role}/projects/${slug}` : null;
  const { data, loading, error, refresh } = useApiQuery(url, {
    skip: !url,
    deps: [role, slug],
  });

  return {
    project: data?.project || null,
    tasks: data?.tasks || [],
    role: data?.role || null,
    loading,
    error,
    refresh,
  };
}