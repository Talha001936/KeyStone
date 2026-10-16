"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { TasksListPage } from "@/components/shared/tasks/TaskListPage";

export default function MemberTasksPage() {
  return (
    <ProtectedPage role="member">
      <TasksListPage
        role="member"
        title="My Tasks"
        description="All tasks assigned to you across your workspace."
        showAssignee={false}
        showNewTask={false}
      />
    </ProtectedPage>
  );
}