// components/shared/team/ChangeAdminPage.jsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Crown, UserCog, Loader2, ShieldCheck } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { useMembers } from "@/hooks/useMembers";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ChangeAdminPage({ role }) {
  const router = useRouter();
  const toast = useToast();
  const { currentWorkspace } = useWorkspace();
  const { refresh: refreshAuth } = useAuth();
  const { members, loading, error, refresh } = useMembers(role);

  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const { currentAdmin, eligible } = useMemo(() => {
    const admin = members.find(
      (m) => m.rawRole === "admin" && m.rawStatus === "active"
    );
    const list = members.filter(
      (m) =>
        m.rawRole === "member" &&
        m.rawStatus === "active" &&
        m.userId !== admin?.userId
    );
    return { currentAdmin: admin || null, eligible: list };
  }, [members]);

  const onPick = (m) => {
    setConfirm({
      member: m,
      title: `Make ${m.name} the new Admin?`,
      description: currentAdmin
        ? `${currentAdmin.name} will become a Member, and ${m.name} will become the Admin. This keeps exactly one Admin per workspace.`
        : `${m.name} will become the workspace Admin.`,
      confirmLabel: "Change admin",
    });
  };

  const onConfirm = async () => {
    if (!confirm?.member) return;
    setBusy(true);
    try {
      await api.post("/api/owner/team/swap-admin", {
        workspaceId: currentWorkspace.id,
        memberId: confirm.member.id,
      });
      toast.success(`${confirm.member.name} is now the Admin`);
      await refreshAuth();
      refresh();
      setConfirm(null);
      router.push(`/${role}/team`);
      router.refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to change admin.");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/${role}/team`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to team
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Change Admin</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Choose which member should hold the Admin role in{" "}
          {currentWorkspace?.name || "this workspace"}.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-accent-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              Current admin:{" "}
              {currentAdmin ? (
                <span className="text-foreground">{currentAdmin.name}</span>
              ) : (
                <span className="text-muted-foreground italic">None</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Picking a member will demote the current admin to Member and
              promote the selected member. Exactly one admin is maintained.
            </p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-sm font-semibold">Eligible members</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Only active members can become Admin.
          </p>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : loading ? (
          <div className="px-6 py-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : eligible.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="No eligible members"
            description="Invite another member first, then come back here."
          />
        ) : (
          <div className="divide-y">
            {eligible.map((m) => (
              <button
                key={m.id}
                onClick={() => onPick(m)}
                disabled={busy}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-muted/30 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                      {initials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.email}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
                  <Crown className="w-3.5 h-3.5" /> Make admin
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && !busy && setConfirm(null)}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        loading={busy}
        onConfirm={onConfirm}
      />
    </div>
  );
}