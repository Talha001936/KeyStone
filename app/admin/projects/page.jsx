"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ProjectsPage } from "@/components/shared/projects/ProjectsPage";

export default function AdminProjectsPage() {
  return (
    <ProtectedPage role="admin">
      <ProjectsPage role="admin" canCreate />
    </ProtectedPage>
  );
}