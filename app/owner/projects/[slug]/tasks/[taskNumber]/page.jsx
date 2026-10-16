"use client";

import { use } from "react";
import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { TaskDetailPage } from "@/components/shared/tasks/TaskDetailPage";

export default function OwnerTaskDetailPage({ params }) {
  const { slug, taskNumber } = use(params);
  return (
    <ProtectedPage role="owner">
      <TaskDetailPage role="owner" slug={slug} taskNumber={taskNumber} />
    </ProtectedPage>
  );
}