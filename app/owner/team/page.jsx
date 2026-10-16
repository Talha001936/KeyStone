"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { TeamPage } from "@/components/shared/team/TeamPage";

export default function OwnerTeamPage() {
  return (
    <ProtectedPage role="owner">
      <TeamPage
        role="owner"
        subtitle="Manage who has access and their roles."
      />
    </ProtectedPage>
  );
}