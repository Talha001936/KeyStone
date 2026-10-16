// components/shared/DashboardStats.jsx
"use client";

import { useTasks } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/useMembers";

/**
 * Aggregate task stats. Always calls every hook unconditionally to
 * respect the Rules of Hooks; `includeMembers` only changes what we
 * return, not which hooks run.
 */
export function useDashboardStats(role, { includeMembers = false } = {}) {
  const { total: totalTasks, loading: l1 } = useTasks(role, { pageSize: 1 });
  const { total: inProgress, loading: l2 } = useTasks(role, {
    pageSize: 1,
    filters: { status: "in_progress" },
  });
  const { total: done, loading: l3 } = useTasks(role, {
    pageSize: 1,
    filters: { status: "done" },
  });
  const { total: todo, loading: l4 } = useTasks(role, {
    pageSize: 1,
    filters: { status: "todo" },
  });

  const membersResult = useMembers(role);
  const members = includeMembers ? membersResult.members : [];
  const l5 = includeMembers ? membersResult.loading : false;

  return {
    totalTasks,
    inProgress,
    done,
    todo,
    members,
    loading: l1 || l2 || l3 || l4 || l5,
  };
}