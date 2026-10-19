"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Users } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { useToast } from "@/contexts/ToastContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMembers } from "@/hooks/useMembers";
import { api } from "@/lib/api";

export default function TransferOwnershipPage() {
  const router = useRouter();
  const toast = useToast();
  const { currentWorkspace } = useWorkspace();
  const { refresh } = useAuth();
  const { members } = useMembers("owner");
  const [confirm, setConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const eligible = members.filter(
    (m) => m.rawRole !== "owner" && m.rawStatus === "active"
  );

  const askTransfer = (member) => {
    const willBecome = member.rawRole === "admin" ? "Admin" : "Member";
    setConfirm({
      member,
      title: `Transfer ownership to ${member.name}?`,
      description: `${member.name} will become the Owner, and you will become a ${willBecome}. This cannot be undone.`,
      confirmLabel: "Transfer ownership",
    });
  };

  const onConfirm = async () => {
    if (!confirm?.member) return;
    setSubmitting(true);
    try {
      const data = await api.post("/api/owner/workspace/transfer", {
        workspaceId: currentWorkspace.id,
        toUserId: confirm.member.userId,
      });

      // The server returns the role we now hold (target's previous role).
      // Trust it directly — no need to wait for AuthContext to catch up.
      const newRole = data?.newRole || "admin";

      // Kick off a background refresh so the rest of the app sees the
      // new role on next render. We're about to navigate away from
      // /owner anyway, so we don't need to await this.

await refresh();

      toast.success("Ownership transferred");
      router.replace(`/${newRole}`);
      router.refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to transfer ownership.");
      setSubmitting(false);
      setConfirm(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link
        href="/owner/workspace/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to workspace settings
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Transfer ownership
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Choose a member to become the new Owner of {currentWorkspace.name}.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium">This action is permanent</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Roles are swapped: the selected user becomes Owner, and you take
          their previous role. This cannot be undone.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold">Select new owner</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Any active member can become the Owner.
            </p>
          </div>
          <Separator />

          {eligible.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No eligible members"
              description="Invite someone to this workspace first, then come back here."
            />
          ) : (
            <div className="space-y-2">
              {eligible.map((m) => {
                const willBecome =
                  m.rawRole === "admin" ? "Admin" : "Member";
                return (
                  <button
                    key={m.id}
                    onClick={() => askTransfer(m)}
                    disabled={submitting}
                    className="w-full flex items-center justify-between gap-4 p-4 rounded-lg border border-border hover:border-accent hover:bg-muted/30 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                          {m.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {m.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.email} · {m.role}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground shrink-0">
                      You become {willBecome}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="h-10"
          nativeButton={false}
          render={<Link href="/owner/workspace/settings" />}
        >
          Cancel
        </Button>
      </div>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && !submitting && setConfirm(null)}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        variant="destructive"
        loading={submitting}
        onConfirm={onConfirm}
      />
    </div>
  );
}