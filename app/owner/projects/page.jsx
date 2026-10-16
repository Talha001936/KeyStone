"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ProjectsPage } from "@/components/shared/projects/ProjectsPage";

export default function OwnerProjectsPage() {
  return (
    <ProtectedPage role="owner">
      <ProjectsPage role="owner" canCreate />
    </ProtectedPage>
  );
}