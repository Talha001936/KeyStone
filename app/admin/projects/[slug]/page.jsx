"use client";

import { use } from "react";
import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ProjectKanbanPage } from "@/components/shared/projects/ProjectKanbanPage";

export default function AdminProjectDetailPage({ params }) {
  const { slug } = use(params);
  return (
    <ProtectedPage role="admin">
      <ProjectKanbanPage role="admin" slug={slug} />
    </ProtectedPage>
  );
}