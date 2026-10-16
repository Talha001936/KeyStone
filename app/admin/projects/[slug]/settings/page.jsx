"use client";

import { use } from "react";
import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ProjectSettingsPage } from "@/components/shared/projects/ProjectSettingsPage";

export default function AdminProjectSettingsPage({ params }) {
  const { slug } = use(params);
  return (
    <ProtectedPage role="admin">
      <ProjectSettingsPage role="admin" slug={slug} />
    </ProtectedPage>
  );
}