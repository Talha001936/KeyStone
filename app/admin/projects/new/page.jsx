"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { NewProjectForm } from "@/components/shared/projects/NewProjectForm";

export default function AdminNewProjectPage() {
  return (
    <ProtectedPage role="admin">
      <NewProjectForm role="admin" />
    </ProtectedPage>
  );
}