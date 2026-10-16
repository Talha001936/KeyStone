"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { NewProjectForm } from "@/components/shared/projects/NewProjectForm";

export default function OwnerNewProjectPage() {
  return (
    <ProtectedPage role="owner">
      <NewProjectForm role="owner" />
    </ProtectedPage>
  );
}