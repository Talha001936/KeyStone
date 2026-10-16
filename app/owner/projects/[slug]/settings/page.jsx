"use client";

import { use } from "react";
import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ProjectSettingsPage } from "@/components/shared/projects/ProjectSettingsPage";

export default function OwnerProjectSettingsPage({ params }) {
  const { slug } = use(params);
  return (
    <ProtectedPage role="owner">
      <ProjectSettingsPage role="owner" slug={slug} />
    </ProtectedPage>
  );
}