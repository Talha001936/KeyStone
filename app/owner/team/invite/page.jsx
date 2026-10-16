"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { InviteMemberPage } from "@/components/shared/team/InviteMemberPage";

export default function OwnerInvitePage() {
  return (
    <ProtectedPage role="owner">
      <InviteMemberPage role="owner" />
    </ProtectedPage>
  );
}