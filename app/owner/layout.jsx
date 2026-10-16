// app/admin/layout.jsx
import { RoleLayout } from "@/components/shared/layout/RoleLayout";

export default function OwnerLayout({ children }) {
  return <RoleLayout role="owner">{children}</RoleLayout>;
}