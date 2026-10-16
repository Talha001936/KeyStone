"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { DashboardPage } from "@/components/shared/dashboard/DashboardPage";

export default function MemberDashboardPage() {
  return (
    <ProtectedPage role="member">
      <DashboardPage role="member" />
    </ProtectedPage>
  );
}