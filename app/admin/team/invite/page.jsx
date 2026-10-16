"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { InviteMemberPage } from "@/components/shared/team/InviteMemberPage";

export default function AdminInvitePage() {
  return (
    <ProtectedPage role="admin">
      <InviteMemberPage role="admin" />
    </ProtectedPage>
  );
}