// hooks/useTaskComments.js
"use client";

import { useCallback } from "react";
import { useApiQuery } from "./useApiQuery";
import { api } from "@/lib/api";

export function useTaskComments(role, slug, taskNumber, { skip = false } = {}) {
  const url =
    !skip && slug && taskNumber
      ? `/api/${role}/projects/${slug}/tasks/${taskNumber}/comments`
      : null;

  const { data, loading, error, refresh } = useApiQuery(url, {
    skip: !url,
    deps: [role, slug, taskNumber],
  });

  const addComment = useCallback(
    async (body) => {
      const text = String(body || "").trim();
      if (!text) throw new Error("Comment cannot be empty.");
      const res = await api.post(
        `/api/${role}/projects/${slug}/tasks/${taskNumber}/comments`,
        { body: text }
      );
      refresh();
      return res.comment;
    },
    [role, slug, taskNumber, refresh]
  );

  return {
    comments: data?.comments || [],
    total: data?.total || 0,
    loading,
    error,
    refresh,
    addComment,
  };
}