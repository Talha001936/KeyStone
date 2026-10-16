// components/shared/layout/Navbar.jsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { Logo } from "@/components/brand/Logo";
import {
  Bell,
  LogOut,
  User,
  Settings,
  Check,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace();
  const { collapsed, toggle } = useSidebar();
  const { user, logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const roleLabels = { owner: "Owner", admin: "Admin", member: "Member" };

  const handleWorkspaceChange = (ws) => {
    setCurrentWorkspace(ws);
    router.push(`/${ws.role}`);
  };

  const handleLogout = async () => {
    setConfirmLogout(false);
    await logout();
    router.push("/login");
  };

  const ws = currentWorkspace || {};
  const wsColor = ws.color || "bg-muted text-muted-foreground";
  const wsInitials = ws.initials || "—";
  const wsName = ws.name || "Workspace";
  const wsRole = ws.role || "member";
  const hasWorkspaces = workspaces.length > 0;

  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 border-b bg-card/70 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0 hidden lg:inline-flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>

        <Logo size="sm" nameClassName="hidden md:inline" />

        <span className="hidden md:block text-muted-foreground/60 mx-1">|</span>

        {hasWorkspaces && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted/60 transition-colors min-w-0">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${wsColor}`}
                  >
                    {wsInitials}
                  </div>
                  <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                    {wsName}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold hidden sm:block">
                    {roleLabels[wsRole]}
                  </span>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              }
            />

            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      Your workspaces
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Switch between workspaces
                    </span>
                  </div>
                </DropdownMenuLabel>

                {workspaces.map((w) => {
                  const isCurrent = w.id === ws.id;
                  return (
                    <DropdownMenuItem
                      key={w.id}
                      onClick={() => handleWorkspaceChange(w)}
                      className="cursor-pointer py-2.5"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${w.color}`}
                        >
                          {w.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {w.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {roleLabels[w.role]}
                          </p>
                        </div>
                        {isCurrent && (
                          <Check className="w-4 h-4 text-accent shrink-0" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          nativeButton={false}
          render={<Link href={`/${wsRole}/activity`} />}
          aria-label="Activity"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="ml-1 rounded-full hover:opacity-90 transition-opacity">
                <Avatar className="h-8 w-8 ring-2 ring-border">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{userName}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {userEmail}
                  </span>
                </div>
              </DropdownMenuLabel>
              {wsRole && (
                <DropdownMenuItem
                  nativeButton={false}
                  render={
                    <Link href={`/${wsRole}/profile`} className="cursor-pointer" />
                  }
                >
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
              )}
              {wsRole === "owner" && (
                <DropdownMenuItem
                  nativeButton={false}
                  render={
                    <Link
                      href="/owner/workspace/settings"
                      className="cursor-pointer"
                    />
                  }
                >
                  <Settings className="w-4 h-4 mr-2" /> Workspace settings
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
                onClick={() => setConfirmLogout(true)}
              >
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title="Log out?"
        description="You'll need to sign in again to access your workspace."
        confirmLabel="Log out"
        variant="destructive"
        onConfirm={handleLogout}
      />
    </header>
  );
}