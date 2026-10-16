"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ProjectsPage } from "@/components/shared/projects/ProjectsPage";

export default function MemberProjectsPage() {
  return (
    <ProtectedPage role="member">
      <ProjectsPage
        role="member"
        description="Projects you're a part of in this workspace."
      />
    </ProtectedPage>
  );
}