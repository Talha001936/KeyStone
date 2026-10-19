// app/member/projects/[slug]/tasks/[taskNumber]/edit/page.jsx
"use client";

import { use } from "react";
import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { EditTaskPage } from "@/components/shared/tasks/EditTaskPage";

export default function MemberEditTaskPage({ params }) {
  const { slug, taskNumber } = use(params);
  return (
    <ProtectedPage role="member">
      <EditTaskPage role="member" slug={slug} taskNumber={taskNumber} />
    </ProtectedPage>
  );
}