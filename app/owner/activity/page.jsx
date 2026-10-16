"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ActivityPage } from "@/components/shared/activity/ActivityPage";

export default function OwnerActivityPage() {
  return (
    <ProtectedPage role="owner">
      <ActivityPage role="owner" />
    </ProtectedPage>
  );
}