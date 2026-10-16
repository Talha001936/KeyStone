"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Search, Mail, Check } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { useToast } from "@/contexts/ToastContext";
import { useRegisteredUsers } from "@/hooks/useRegisteredUsers";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { api } from "@/lib/api";

export function InviteMemberPage({ role }) {
  const { currentWorkspace } = useWorkspace();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const { users, loading, error, refresh } = useRegisteredUsers(role, {
    q: search,
  });

  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invitedIds, setInvitedIds] = useState(new Set());

  const onPick = (user) => setSelected(user);

  const onConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const { user } = await api.post(`/api/${role}/team/invite`, {
        userId: selected.id,
        workspaceId: currentWorkspace.id,
      });
      setInvitedIds((prev) => new Set(prev).add(user.id));
      toast.success(`Invite sent to ${user.email}`);
      setSelected(null);
      refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to send invite.");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const workspaceName = currentWorkspace?.name || "this workspace";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/${role}/team`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to team
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invite member</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select a registered user to invite to {workspaceName}.
        </p>
      </div>

      <Card className="border-accent/40 bg-accent/5">
        <CardContent className="pt-6 text-sm">
          <p className="font-medium">How it works</p>
          <p className="text-muted-foreground mt-1 leading-relaxed">
            The first person you invite becomes an <strong>Admin</strong>.
            Every subsequent invitee joins as a <strong>Member</strong>. They'll
            receive a link and can join {workspaceName} with one click.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registered users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          {error ? (
            <ErrorState error={error} onRetry={refresh} />
          ) : loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No users found"
              description={
                search
                  ? "Try a different search term."
                  : "Every registered user is already in this workspace."
              }
            />
          ) : (
            <div className="divide-y border rounded-lg">
              {users.map((u) => {
                const alreadyInvited =
                  invitedIds.has(u.id) || u.hasPendingInvite;
                const isSelected = selected?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={alreadyInvited}
                    onClick={() => onPick(u)}
                    className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                      isSelected
                        ? "bg-accent/10"
                        : alreadyInvited
                        ? "opacity-60 cursor-default"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                          {u.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {u.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    {alreadyInvited ? (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Check className="w-3 h-3" /> Invited
                      </Badge>
                    ) : isSelected ? (
                      <Badge className="text-xs">Selected</Badge>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        Select
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              disabled={!selected || submitting}
              onClick={() => setConfirmOpen(true)}
              className="h-10"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send invite
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Send invite?"
        description={`An invite link will be generated for ${selected?.email}. They'll be able to join ${workspaceName} by clicking it.`}
        confirmLabel="Send invite"
        loading={submitting}
        onConfirm={onConfirm}
      />
    </div>
  );
}