"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ActivityPage } from "@/components/shared/activity/ActivityPage";

export default function MemberActivityPage() {
  return (
    <ProtectedPage role="member">
      <ActivityPage
        role="member"
        description="Recent changes across your workspace."
      />
    </ProtectedPage>
  );
}