// components/shared/team/TeamPage.jsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { PageHeader } from "@/components/shared/ui/PageHeader";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { useMembers } from "@/hooks/useMembers";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import {
  UserPlus,
  MoreHorizontal,
  UserCheck,
  UserX,
  Trash2,
  Users,
  ArrowLeftRight,
  Crown,
  ShieldCheck,
} from "lucide-react";

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ROLE_LABELS = { owner: "Owner", admin: "Admin", member: "Member" };

const HEADER_ROW_CLASS =
  "hidden lg:grid grid-cols-[minmax(280px,2.5fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)_44px] items-center gap-6 px-5 py-2.5 border-b bg-muted/20 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground";

const DESKTOP_ROW_CLASS =
  "hidden lg:grid grid-cols-[minmax(280px,2.5fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)_44px] items-center gap-6 px-5 py-3";

export function TeamPage({ role, subtitle }) {
  const router = useRouter();
  const { members, currentUserId, loading, error, refresh } = useMembers(role);
  const { currentWorkspace } = useWorkspace();
  const { refresh: refreshAuth } = useAuth();
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const callerRole = role;
  const canManage = callerRole === "owner" || callerRole === "admin";

  const runAction = async (fn, successMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMsg);
      setConfirm(null);
      refresh();
      refreshAuth();
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- OWNER ACTIONS ---------- */

  const ownerTransferOwnership = (m) => {
    setConfirm({
      member: m,
      title: `Transfer ownership to ${m.name}?`,
      description: `${m.name} will become the Owner, and you will become ${
        m.rawRole === "admin" ? "an Admin" : "a Member"
      }. You can swap back only if they transfer ownership back to you.`,
      confirmLabel: "Transfer ownership",
      variant: "destructive",
      onConfirm: () => {
        const workspaceId = m.workspaceId || currentWorkspace?.id;
        return runAction(
          () =>
            api.post("/api/owner/workspace/transfer", {
              workspaceId,
              toUserId: m.userId,
            }),
          "Ownership transferred"
        );
      },
    });
  };

  // Owner acts on ADMIN → go to change-admin page (list members).
  const ownerChangeAdmin = () => {
    router.push(`/${role}/team/change-admin`);
  };

  // Owner acts on MEMBER → direct swap (promote to admin).
  const ownerPromoteMember = (m) => {
    setConfirm({
      member: m,
      title: `Make ${m.name} the Admin?`,
      description: `The current Admin will be demoted to Member, and ${m.name} will become the Admin.`,
      confirmLabel: "Promote to Admin",
      variant: "default",
      onConfirm: () =>
        runAction(
          () =>
            api.post("/api/owner/team/swap-admin", {
              workspaceId: currentWorkspace?.id,
              memberId: m.id,
            }),
          "Member promoted to Admin"
        ),
    });
  };

  /* ---------- ADMIN ACTIONS ---------- */

  const adminPromoteMember = (m) => {
    setConfirm({
      member: m,
      title: `Promote ${m.name} to Admin?`,
      description: `${m.name} will become the new Admin, and you will become a Member. This keeps exactly one Admin per workspace.`,
      confirmLabel: "Promote to Admin",
      variant: "default",
      onConfirm: () =>
        runAction(
          () => api.patch(`/api/admin/team/${m.id}`, { role: "admin" }),
          "Member promoted to Admin"
        ),
    });
  };

  /* ---------- SHARED ---------- */

  const onToggleStatus = (m) => {
    const targetStatus = m.rawStatus === "active" ? "inactive" : "active";
    const isDeactivating = targetStatus === "inactive";
    setConfirm({
      member: m,
      title: isDeactivating ? "Deactivate member?" : "Activate member?",
      description: isDeactivating
        ? `${m.name} will lose access immediately.`
        : `${m.name} will regain workspace access.`,
      confirmLabel: isDeactivating ? "Deactivate" : "Activate",
      variant: isDeactivating ? "destructive" : "default",
      onConfirm: () =>
        runAction(
          () =>
            api.patch(`/api/${role}/team/${m.id}`, { status: targetStatus }),
          isDeactivating ? "Member deactivated" : "Member activated"
        ),
    });
  };

  const onRemove = (m) => {
    setConfirm({
      member: m,
      title: "Remove member?",
      description: `${m.name} will be permanently removed from this workspace.`,
      confirmLabel: "Remove",
      variant: "destructive",
      onConfirm: () =>
        runAction(
          () => api.delete(`/api/${role}/team/${m.id}`),
          "Member removed"
        ),
    });
  };

  /* ---------- MENU BUILDERS ---------- */

  function buildOwnerMenu(m) {
    const isSelf = m.userId === currentUserId;
    const isOwner = m.rawRole === "owner";
    const isAdmin = m.rawRole === "admin";
    const isMember = m.rawRole === "member";
    const isActive = m.rawStatus === "active";

    if (isSelf || isOwner) return null;

    const canTransfer =
      callerRole === "owner" && !isOwner && isActive;
    const canChangeAdminHere =
      callerRole === "owner" && isAdmin && isActive;
    const canPromoteDirect =
      callerRole === "owner" && isMember && isActive;
    const canToggle = canManage && isActive ? true : !isActive;
    const canRemove = canManage && !isOwner;

    if (
      !canTransfer &&
      !canChangeAdminHere &&
      !canPromoteDirect &&
      !canRemove
    )
      return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Open member actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {m.name.split(" ")[0]}
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          {canTransfer && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => ownerTransferOwnership(m)}>
                  <Crown className="w-4 h-4 mr-2" /> Transfer ownership
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}

          {canChangeAdminHere && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={ownerChangeAdmin}>
                  <ShieldCheck className="w-4 h-4 mr-2" /> Change admin
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}

          {canPromoteDirect && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => ownerPromoteMember(m)}>
                  <ArrowLeftRight className="w-4 h-4 mr-2" /> Promote to Admin
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => onToggleStatus(m)}>
              {m.rawStatus === "active" ? (
                <>
                  <UserX className="w-4 h-4 mr-2" /> Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" /> Activate
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {canRemove && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onRemove(m)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Remove
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function buildAdminMenu(m) {
    const isSelf = m.userId === currentUserId;
    const isOwner = m.rawRole === "owner";
    const isMember = m.rawRole === "member";
    const isActive = m.rawStatus === "active";

    if (isSelf || isOwner) return null;

    const canPromote = callerRole === "admin" && isMember && isActive;
    const canRemove = callerRole === "admin" && !isOwner && !isSelf;

    if (!canPromote && !canRemove) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Open member actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {m.name.split(" ")[0]}
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          {canPromote && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => adminPromoteMember(m)}>
                  <ArrowLeftRight className="w-4 h-4 mr-2" /> Promote to Admin
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}

          {canRemove && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onRemove(m)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Remove
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const buildMenu = callerRole === "owner" ? buildOwnerMenu : buildAdminMenu;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team"
        description={subtitle || "Manage members and roles."}
        action={
          canManage ? (
            <Button
              nativeButton={false}
              render={<Link href={`/${role}/team/invite`} />}
            >
              <UserPlus className="w-4 h-4 mr-2" /> Invite member
            </Button>
          ) : null
        }
      />

      {error ? (
        <Card>
          <ErrorState error={error} onRetry={refresh} />
        </Card>
      ) : loading ? (
        <Card className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-muted/30 animate-pulse"
            />
          ))}
        </Card>
      ) : members.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No members yet"
            description="Invite teammates to collaborate."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className={HEADER_ROW_CLASS}>
            <span>Member</span>
            <span>Role</span>
            <span>Joined</span>
            <span>Status</span>
            <span />
          </div>

          <div className="divide-y divide-border/60">
            <AnimatePresence initial={false}>
              {members.map((m, i) => {
                const isOwner = m.rawRole === "owner";
                const isAdmin = m.rawRole === "admin";
                const isSelf = m.userId === currentUserId;
                const isActive = m.rawStatus === "active";
                const menu = buildMenu(m);

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: Math.min(i * 0.02, 0.1),
                    }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <div className={DESKTOP_ROW_CLASS}>
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                            {initials(m.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate leading-tight">
                            {m.name}
                            {isSelf && (
                              <span className="text-xs font-normal text-muted-foreground ml-1.5">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                            {m.email}
                          </p>
                        </div>
                      </div>

                      <RoleBadge
                        isOwner={isOwner}
                        isAdmin={isAdmin}
                        label={ROLE_LABELS[m.rawRole] || m.rawRole}
                      />

                      <span className="text-xs text-muted-foreground truncate">
                        {m.joined}
                      </span>

                      <StatusDot active={isActive} />

                      <div className="flex justify-end">
                        {menu || (
                          <span className="text-[11px] text-muted-foreground italic">
                            {isSelf ? "You" : "—"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mobile row */}
                    <div className="lg:hidden px-4 py-3 flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                          {initials(m.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {m.name}
                          {isSelf && (
                            <span className="text-xs font-normal text-muted-foreground ml-1.5">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.email}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <RoleBadge
                          isOwner={isOwner}
                          isAdmin={isAdmin}
                          label={ROLE_LABELS[m.rawRole] || m.rawRole}
                        />
                        {menu}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && !busy && setConfirm(null)}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
        loading={busy}
        onConfirm={() => confirm?.onConfirm?.()}
      />
    </div>
  );
}

function RoleBadge({ isOwner, isAdmin, label }) {
  if (isOwner) {
    return (
      <span className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-[11px] font-semibold w-fit">
        {label}
      </span>
    );
  }
  if (isAdmin) {
    return (
      <span className="inline-flex items-center rounded-full bg-accent/20 text-accent-foreground px-2.5 py-0.5 text-[11px] font-semibold w-fit">
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground w-fit">
      {label}
    </span>
  );
}

function StatusDot({ active }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? "bg-accent" : "bg-muted-foreground/40"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}