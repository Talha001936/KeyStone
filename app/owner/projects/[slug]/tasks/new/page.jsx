"use client";

import { use } from "react";
import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { NewTaskForm } from "@/components/shared/tasks/NewTaskForm";

export default function OwnerNewTaskPage({ params }) {
  const { slug } = use(params);
  return (
    <ProtectedPage role="owner">
      <NewTaskForm role="owner" slug={slug} />
    </ProtectedPage>
  );
}