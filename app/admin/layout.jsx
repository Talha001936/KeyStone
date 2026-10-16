// app/admin/layout.jsx
import { RoleLayout } from "@/components/shared/layout/RoleLayout";

export default function AdminLayout({ children }) {
  return <RoleLayout role="admin">{children}</RoleLayout>;
}