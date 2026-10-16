// components/shared/workspace/WorkspaceSettingsPage.jsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import {
  Users,
  FolderKanban,
  ListChecks,
  Plus,
  ArrowRight,
  Trash2,
  Save,
  Loader2,
  Sparkles,
} from "lucide-react";

const stagger = (i) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.5,
    delay: Math.min(i * 0.08, 0.4),
    ease: [0.22, 1, 0.36, 1],
  },
});

const ROLE_LABELS = { owner: "Owner", admin: "Admin", member: "Member" };

export function WorkspaceSettingsPage({ role = "owner" }) {
  const router = useRouter();
  const toast = useToast();
  const { currentWorkspace } = useWorkspace();
  const { refresh: refreshAuth } = useAuth();

  const [name, setName] = useState(currentWorkspace?.name || "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const dirty = name.trim() !== (currentWorkspace?.name || "").trim();
  const canEdit = role === "owner";
  const canDelete = role === "owner";

  useEffect(() => {
    setName(currentWorkspace?.name || "");
  }, [currentWorkspace?.name]);

  useEffect(() => {
    let cancelled = false;
    if (!currentWorkspace?.id) return;
    setStatsLoading(true);
    api
      .get(`/api/owner/workspace/${currentWorkspace.id}/stats`)
      .then((data) => {
        if (cancelled) return;
        setStats(data.stats);
      })
      .catch(() => {
        if (cancelled) return;
        setStats(null);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentWorkspace?.id]);

  const blockReasons = [];
  if (stats) {
    if (stats.projects > 0)
      blockReasons.push(
        `${stats.projects} project${stats.projects === 1 ? "" : "s"}`
      );
    if (stats.tasks > 0)
      blockReasons.push(`${stats.tasks} task${stats.tasks === 1 ? "" : "s"}`);
    const extraMembers = Math.max(0, stats.members - 1);
    if (extraMembers > 0)
      blockReasons.push(
        `${extraMembers} other member${extraMembers === 1 ? "" : "s"}`
      );
  }
  const blocked = blockReasons.length > 0;

  const onSave = async () => {
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (name.trim().length > 60) {
      toast.error("Name must be 60 characters or fewer");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/owner/workspace/${currentWorkspace.id}`, {
        name: name.trim(),
      });
      await refreshAuth();
      toast.success("Workspace updated");
    } catch (err) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/owner/workspace/${currentWorkspace.id}`);
      await refreshAuth();
      toast.success("Workspace deleted");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to delete workspace");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        {...stagger(0)}
        className="relative rounded-2xl border border-border/70 bg-card overflow-hidden"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 w-56 h-56 rounded-full bg-accent/25 blur-3xl"
          animate={{
            x: [0, -14, 0],
            y: [0, 10, 0],
            opacity: [0.55, 0.75, 0.55],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <motion.div
                whileHover={{ rotate: -5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="shrink-0 w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-[0_8px_20px_-8px_rgba(70,63,58,0.4)]"
              >
                {(currentWorkspace.initials || "—").slice(0, 2)}
              </motion.div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight truncate">
                    {currentWorkspace.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      currentWorkspace.role === "owner"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent/20 text-accent-foreground"
                    }`}
                  >
                    {ROLE_LABELS[currentWorkspace.role] ||
                      currentWorkspace.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <ActionPill
                icon={Plus}
                label="Invite"
                href="/owner/team/invite"
              />
              {canEdit && (
                <ActionPill
                  icon={ArrowRight}
                  label="Transfer"
                  href="/owner/workspace/transfer"
                />
              )}
              {canDelete && (
                <ActionPill
                  icon={Trash2}
                  label="Delete"
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                  disabled={statsLoading}
                />
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div {...stagger(1)}>
        <Card className="overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border/60">
            <StatCell
              icon={Users}
              label="Members"
              value={statsLoading ? "—" : stats?.members ?? "—"}
            />
            <StatCell
              icon={FolderKanban}
              label="Projects"
              value={statsLoading ? "—" : stats?.projects ?? "—"}
            />
            <StatCell
              icon={ListChecks}
              label="Tasks"
              value={statsLoading ? "—" : stats?.tasks ?? "—"}
            />
            <StatCell
              icon={Sparkles}
              label="In progress"
              value={statsLoading ? "—" : stats?.activeTasks ?? "—"}
              accent
            />
          </div>
        </Card>
      </motion.div>

      <motion.div {...stagger(2)}>
        <Card className="overflow-hidden">
          <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Workspace settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {canEdit
                  ? "Update your workspace's display name."
                  : "Settings are managed by the Owner."}
              </p>
            </div>
          </div>

          <Separator />

          <div className="px-6 py-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 max-w-md transition-shadow focus-visible:shadow-[0_0_0_4px_rgba(224,175,160,0.2)]"
                maxLength={60}
                disabled={!canEdit}
                readOnly={!canEdit}
              />
              <p className="text-xs text-muted-foreground">
                Shown across the app — 2 to 60 characters.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Workspace ID</Label>
              <Input
                value={currentWorkspace.slug || currentWorkspace.id || ""}
                disabled
                className="h-11 max-w-md bg-muted/40 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Generated automatically and cannot be changed.
              </p>
            </div>

            <AnimatePresence initial={false}>
              {canEdit && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 pt-1">
                    <motion.div
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 22,
                      }}
                    >
                      <Button
                        onClick={onSave}
                        disabled={!dirty || saving}
                        className="h-10 px-5"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save changes
                          </>
                        )}
                      </Button>
                    </motion.div>

                    <AnimatePresence>
                      {dirty && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.2 }}
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          Unsaved changes
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={blocked ? "Cannot delete this workspace" : "Delete workspace?"}
        description={
          blocked
            ? `This workspace still has ${blockReasons.join(
                ", "
              )}. Remove them before deleting the workspace.`
            : `Every project, task, member, comment, and activity in "${currentWorkspace.name}" will be permanently deleted. This cannot be undone.`
        }
        confirmLabel={
          blocked ? "Close" : deleting ? "Deleting…" : "Delete workspace"
        }
        variant={blocked ? "default" : "destructive"}
        loading={deleting}
        onConfirm={blocked ? () => setConfirmDelete(false) : onDelete}
      />
    </div>
  );
}

function ActionPill({ icon: Icon, label, href, onClick, variant, disabled }) {
  const base =
    "inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none";

  const styles =
    variant === "destructive"
      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_6px_14px_-8px_rgba(192,92,92,0.6)]"
      : "border border-border bg-card hover:bg-muted/60 hover:border-primary/40 text-foreground";

  const content = (
    <>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <motion.div
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
      >
        <Link href={href} className={`${base} ${styles}`}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      whileHover={!disabled ? { y: -1 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles}`}
    >
      {content}
    </motion.button>
  );
}

function StatCell({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          accent
            ? "bg-accent/20 text-accent-foreground"
            : "bg-muted/60 text-muted-foreground"
        }`}
      >
        <Icon className="w-4 h-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <motion.p
          key={String(value)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-base font-semibold tabular-nums leading-tight"
        >
          {value}
        </motion.p>
      </div>
    </div>
  );
}