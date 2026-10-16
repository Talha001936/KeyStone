// app/admin/layout.jsx
import { RoleLayout } from "@/components/shared/layout/RoleLayout";

export default function MemberLayout({ children }) {
  return <RoleLayout role="member">{children}</RoleLayout>;
}