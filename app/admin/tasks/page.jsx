"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { TasksListPage } from "@/components/shared/tasks/TaskListPage";

export default function AdminTasksPage() {
  return (
    <ProtectedPage role="admin">
      <TasksListPage role="admin" showAssignee showNewTask />
    </ProtectedPage>
  );
}