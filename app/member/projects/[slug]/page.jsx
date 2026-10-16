"use client";

import { use } from "react";
import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ProjectKanbanPage } from "@/components/shared/projects/ProjectKanbanPage";

export default function MemberProjectDetailPage({ params }) {
  const { slug } = use(params);
  return (
    <ProtectedPage role="member">
      <ProjectKanbanPage role="member" slug={slug} />
    </ProtectedPage>
  );
}