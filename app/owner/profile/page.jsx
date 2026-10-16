"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ProfilePage } from "@/components/shared/profile/ProfilePage";

export default function OwnerProfilePage() {
  return (
    <ProtectedPage role="owner">
      <ProfilePage roleLabel="Owner" />
    </ProtectedPage>
  );
}