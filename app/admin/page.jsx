"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { DashboardPage } from "@/components/shared/dashboard/DashboardPage";

export default function AdminDashboardPage() {
  return (
    <ProtectedPage role="admin">
      <DashboardPage role="admin" />
    </ProtectedPage>
  );
}