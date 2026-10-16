"use client";

import { use } from "react";
import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { TaskDetailPage } from "@/components/shared/tasks/TaskDetailPage";

export default function MemberTaskDetailPage({ params }) {
  const { slug, taskNumber } = use(params);
  return (
    <ProtectedPage role="member">
      <TaskDetailPage role="member" slug={slug} taskNumber={taskNumber} />
    </ProtectedPage>
  );
}