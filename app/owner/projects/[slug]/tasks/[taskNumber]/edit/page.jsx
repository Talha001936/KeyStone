// app/owner/projects/[slug]/tasks/[taskNumber]/edit/page.jsx
"use client";

import { use } from "react";
import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { EditTaskPage } from "@/components/shared/tasks/EditTaskPage";

export default function OwnerEditTaskPage({ params }) {
  const { slug, taskNumber } = use(params);
  return (
    <ProtectedPage role="owner">
      <EditTaskPage role="owner" slug={slug} taskNumber={taskNumber} />
    </ProtectedPage>
  );
}