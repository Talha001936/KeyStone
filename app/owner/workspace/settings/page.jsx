"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { WorkspaceSettingsPage } from "@/components/shared/workspace/WorkspaceSettingsPage";

export default function OwnerWorkspaceSettingsPage() {
  return (
    <ProtectedPage role="owner">
      <WorkspaceSettingsPage role="owner" />
    </ProtectedPage>
  );
}