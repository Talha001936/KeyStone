"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ChangeAdminPage } from "@/components/shared/team/ChangeAdminPage";

export default function OwnerChangeAdminPage() {
  return (
    <ProtectedPage role="owner">
      <ChangeAdminPage role="owner" />
    </ProtectedPage>
  );
}