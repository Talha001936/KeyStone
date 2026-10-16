"use client";

import { ProtectedPage } from "@/components/shared/layout/ProtectedPage";
import { ProfilePage } from "@/components/shared/profile/ProfilePage";

export default function MemberProfilePage() {
  return (
    <ProtectedPage role="member">
      <ProfilePage roleLabel="Member" />
    </ProtectedPage>
  );
}