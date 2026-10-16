"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ProfilePage } from "@/components/shared/profile/ProfilePage";

export default function AdminProfilePage() {
  return (
    <ProtectedPage role="admin">
      <ProfilePage roleLabel="Admin" />
    </ProtectedPage>
  );
}