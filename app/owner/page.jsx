"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { DashboardPage } from "@/components/shared/dashboard/DashboardPage";

export default function OwnerDashboardPage() {
  return (
    <ProtectedPage role="owner">
      <DashboardPage role="owner" />
    </ProtectedPage>
  );
}