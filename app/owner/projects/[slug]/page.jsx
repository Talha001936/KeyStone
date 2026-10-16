"use client";

import { use } from "react";
import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ProjectKanbanPage } from "@/components/shared/projects/ProjectKanbanPage";

export default function OwnerProjectDetailPage({ params }) {
  const { slug } = use(params);
  return (
    <ProtectedPage role="owner">
      <ProjectKanbanPage role="owner" slug={slug} />
    </ProtectedPage>
  );
}