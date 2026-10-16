"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { TeamPage } from "@/components/shared/team/TeamPage";

export default function AdminTeamPage() {
  return (
    <ProtectedPage role="admin">
      <TeamPage role="admin" subtitle="Manage members and roles." />
    </ProtectedPage>
  );
}