"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ActivityPage } from "@/components/shared/activity/ActivityPage";

export default function AdminActivityPage() {
  return (
    <ProtectedPage role="admin">
      <ActivityPage role="admin" />
    </ProtectedPage>
  );
}