"use client";

import { use } from "react";
import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { TaskDetailPage } from "@/components/shared/tasks/TaskDetailPage";

export default function AdminTaskDetailPage({ params }) {
  const { slug, taskNumber } = use(params);
  return (
    <ProtectedPage role="admin">
      <TaskDetailPage role="admin" slug={slug} taskNumber={taskNumber} />
    </ProtectedPage>
  );
}