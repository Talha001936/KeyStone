// components/shared/layout/Sidebar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, ListChecks, Users,
  Activity, Settings, CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { ROLE_NAV } from "@/lib/constants";

const ICONS = {
  LayoutDashboard, FolderKanban, ListChecks, Users,
  Activity, Settings, CheckSquare,
};

export function Sidebar({ role }) {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();
  const { collapsed } = useSidebar();
  const nav = ROLE_NAV[role] || [];

  const wsColor = currentWorkspace?.color || "bg-muted text-muted-foreground";
  const wsInitials = currentWorkspace?.initials || "—";
  const wsName = currentWorkspace?.name || "Workspace";

  const isActive = (href) =>
    href === `/${role}` ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-card h-[calc(100vh-64px)] sticky top-16 transition-[width] duration-300 ease-out",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div className={cn("border-b transition-all duration-300", collapsed ? "p-3" : "p-5")}>
        {collapsed ? (
          <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-xs font-bold ${wsColor}`}>
            {wsInitials}
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Workspace
            </p>
            <p className="text-sm font-semibold truncate">{wsName}</p>
          </>
        )}
      </div>

      <nav className={cn("flex-1 overflow-y-auto space-y-1", collapsed ? "p-2" : "p-3")}>
        {nav.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-5 border-t text-xs text-muted-foreground">
          {role === "member" ? "Member access" : role === "admin" ? "Managed by Admin" : ""}
        </div>
      )}
    </aside>
  );
}