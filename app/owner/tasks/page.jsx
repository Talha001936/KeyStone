"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { TasksListPage } from "@/components/shared/tasks/TaskListPage";

export default function OwnerTasksPage() {
  return (
    <ProtectedPage role="owner">
      <TasksListPage role="owner" showAssignee showNewTask />
    </ProtectedPage>
  );
}