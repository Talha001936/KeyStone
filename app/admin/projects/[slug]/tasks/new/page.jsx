"use client";

import { use } from "react";
import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { NewTaskForm } from "@/components/shared/tasks/NewTaskForm";

export default function AdminNewTaskPage({ params }) {
  const { slug } = use(params);
  return (
    <ProtectedPage role="admin">
      <NewTaskForm role="admin" slug={slug} />
    </ProtectedPage>
  );
}