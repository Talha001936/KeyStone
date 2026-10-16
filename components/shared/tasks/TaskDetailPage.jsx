// components/shared/tasks/TaskDetailPage.jsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { useToast } from "@/contexts/ToastContext";
import { useTask } from "@/hooks/useTask";
import { useTaskComments } from "@/hooks/useTaskComments";
import { useMembers } from "@/hooks/useMembers";
import { api, ApiError } from "@/lib/api";
import { validateTask, todayISO } from "@/lib/validation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Send,
  Calendar,
  User,
  Flag,
  Hash,
  Lock,
} from "lucide-react";

const STATUS_LABELS = { todo: "To Do", in_progress: "In Progress", done: "Done" };
const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High" };

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relativeTime(value) {
  if (!value) return "";
  const d = new Date(value);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TaskDetailPage({ role, slug, taskNumber }) {
  const router = useRouter();
  const toast = useToast();

  const { task, role: callerRole, isAssignee, loading, error, refresh } =
    useTask(role, slug, taskNumber);

  // Permissions derived from the *actual* caller role returned by the API.
  const canEditAll = callerRole === "owner" || callerRole === "admin";
  const canChangeStatus = isAssignee;
  const canDelete = canEditAll;
  // Comments: owner/admin always; assignee always; otherwise no access.
  const canComment = isAssignee || canEditAll;

  // Only fetch members when the caller can reassign (owner/admin).
  const { members, loading: membersLoading } = useMembers(role, {
    skip: !canEditAll,
  });

  // Only fetch comments when the caller has read access.
  const { comments, loading: commentsLoading, addComment } = useTaskComments(
    role,
    slug,
    taskNumber,
    { skip: !canComment }
  );

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const [commentBody, setCommentBody] = useState("");
  const [posting, setPosting] = useState(false);

  const projectDue = useMemo(() => {
    if (!task?.projectDueDate) return null;
    const d = new Date(task.projectDueDate);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }, [task?.projectDueDate]);

  const enterEdit = () => {
    setForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      priority: task.priority || "medium",
      assigneeId: task.assigneeId || "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
  };

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onSave = async () => {
    if (!form || !task) return;

    const payload = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      assigneeId: form.assigneeId || null,
      dueDate: form.dueDate || null,
    };
    if (canChangeStatus) payload.status = form.status;

    const v = validateTask(payload, "update", {
      projectDueDate: task.projectDueDate || null,
    });
    if (!v.ok) {
      toast.error(v.message);
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/api/${role}/projects/${slug}/tasks/${taskNumber}`, {
        ...v.value,
        _version: task.version,
      });
      toast.success("Task updated");
      setEditing(false);
      setForm(null);
      refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === "CONFLICT") {
        toast.error("Task was updated by someone else");
        refresh();
      } else {
        toast.error(err?.message || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    try {
      await api.delete(`/api/${role}/projects/${slug}/tasks/${taskNumber}`);
      toast.success("Task deleted");
      router.push(`/${role}/projects/${slug}`);
      router.refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  const onPostComment = async () => {
    const text = commentBody.trim();
    if (!text) return;
    setPosting(true);
    try {
      await addComment(text);
      setCommentBody("");
      toast.success("Comment posted");
    } catch (err) {
      toast.error(err?.message || "Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const handleBack = () => {
    if (editing) setConfirmDiscard(true);
    else router.push(`/${role}/projects/${slug}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-muted/40 rounded" />
        <div className="h-64 bg-muted/30 rounded-2xl" />
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refresh} />;
  if (!task) return <ErrorState error={{ message: "Task not found" }} />;

  const selectedMember =
    members.find((m) => m.userId === (form?.assigneeId || task.assigneeId)) ||
    null;
  const minDue = todayISO();
  const maxDue = projectDue || undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to project
      </button>

      {editing ? (
        <Card className="overflow-hidden">
          <div className="px-6 py-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="h-12 text-lg font-semibold"
                placeholder="Task title"
                autoFocus
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {canChangeStatus && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => update("status", v)}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => update("priority", v)}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {canEditAll && (
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select
                    value={form.assigneeId || "none"}
                    onValueChange={(v) =>
                      update("assigneeId", v === "none" ? "" : v)
                    }
                    disabled={membersLoading}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue>
                        {selectedMember ? (
                          <span className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="bg-muted text-foreground text-[9px] font-semibold">
                                {initials(selectedMember.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              {selectedMember.name}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          <span className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="bg-muted text-foreground text-[9px] font-semibold">
                                {initials(m.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{m.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {canEditAll && (
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => update("dueDate", e.target.value)}
                    min={minDue}
                    max={maxDue}
                    className="h-11"
                  />
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Add a description…"
                className="min-h-[180px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDiscard(true)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={onSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[11px] font-mono text-muted-foreground">
                  #{task.displayNumber ?? "—"}
                </span>
                <LocalStatusBadge status={task.status} />
                <LocalPriorityBadge priority={task.priority} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight break-words">
                {task.title}
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canEditAll && (
                <Button variant="outline" className="h-9" onClick={enterEdit}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  className="h-9"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="grid lg:grid-cols-3">
              <div
                className={
                  canComment
                    ? "lg:col-span-2 lg:border-r border-border/60"
                    : "lg:col-span-3"
                }
              >
                <section className="px-6 py-6">
                  <SectionLabel>Description</SectionLabel>
                  {task.description ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap mt-3">
                      {task.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic mt-3">
                      No description.
                    </p>
                  )}
                </section>

                {/* ---- Comments: only rendered for users with comment access ---- */}
                {canComment ? (
                  <>
                    <Separator />

                    <section className="px-6 py-6">
                      <SectionLabel>
                        Comments
                        {comments.length > 0 && (
                          <span className="ml-1.5 text-muted-foreground/70 font-normal">
                            ({comments.length})
                          </span>
                        )}
                      </SectionLabel>

                      <div className="mt-4">
                        {commentsLoading ? (
                          <div className="space-y-3">
                            {[1, 2].map((i) => (
                              <div
                                key={i}
                                className="h-16 rounded-lg bg-muted/30 animate-pulse"
                              />
                            ))}
                          </div>
                        ) : comments.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">
                            No comments yet.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {comments.map((c) => (
                              <div key={c.id} className="flex gap-3">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarFallback className="bg-accent/25 text-accent-foreground text-[11px] font-semibold">
                                    {c.authorInitials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-sm font-medium">
                                      {c.authorName}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                      {relativeTime(c.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed text-muted-foreground">
                                    {c.body}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-5 border-t border-dashed border-border/70">
                        <Textarea
                          placeholder="Write a comment…"
                          className="min-h-[80px]"
                          value={commentBody}
                          onChange={(e) => setCommentBody(e.target.value)}
                          maxLength={5000}
                          disabled={posting}
                        />
                        <div className="flex justify-end mt-3">
                          <Button
                            size="sm"
                            onClick={onPostComment}
                            disabled={posting || !commentBody.trim()}
                          >
                            {posting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                Posting…
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5 mr-2" />
                                Post comment
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </section>
                  </>
                ) : (
                  /* Read-only users: subtle notice instead of a comment box. */
                  <>
                    <Separator />
                    <section className="px-6 py-5">
                      <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <p>
                          Only the assignee and workspace admins can view or
                          post comments on this task.
                        </p>
                      </div>
                    </section>
                  </>
                )}
              </div>

              {canComment && (
                <div className="bg-muted/30 rounded-lg">
                  <section className="px-6 py-6">
                    <SectionLabel>Details</SectionLabel>
                    <dl className="mt-4 space-y-3.5">
                      <DetailRow
                        icon={Hash}
                        label="Task ID"
                        value={
                          <span className="font-mono text-xs">{task.code}</span>
                        }
                      />
                      <DetailRow
                        icon={Flag}
                        label="Priority"
                        value={<LocalPriorityBadge priority={task.priority} />}
                      />
                      <DetailRow
                        icon={User}
                        label="Assignee"
                        value={
                          task.assigneeName ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="bg-muted text-foreground text-[9px] font-semibold">
                                  {task.assigneeInitials || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">
                                {task.assigneeName}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              Unassigned
                            </span>
                          )
                        }
                      />
                      <DetailRow
                        icon={Calendar}
                        label="Due date"
                        value={task.dueDate ? formatDate(task.dueDate) : "—"}
                      />
                    </dl>
                  </section>
                </div>
              )}
            </div>

            {/* When comments are hidden, move Details into the main column so
                the layout doesn't collapse into a single sidebar. */}
            {!canComment && (
              <div className="border-t border-border/60 px-6 py-6">
                <SectionLabel>Details</SectionLabel>
                <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <dt className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Hash className="w-3.5 h-3.5" /> Task ID
                    </dt>
                    <dd className="text-sm mt-1 font-mono">
                      {task.code}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Flag className="w-3.5 h-3.5" /> Priority
                    </dt>
                    <dd className="text-sm mt-1">
                      <LocalPriorityBadge priority={task.priority} />
                    </dd>
                  </div>
                  <div>
                    <dt className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3.5 h-3.5" /> Assignee
                    </dt>
                    <dd className="text-sm mt-1 truncate">
                      {task.assigneeName || (
                        <span className="text-muted-foreground italic">
                          Unassigned
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" /> Due date
                    </dt>
                    <dd className="text-sm mt-1">
                      {task.dueDate ? formatDate(task.dueDate) : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </Card>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete task?"
        description="This task and its activity history will be permanently removed. This cannot be undone."
        confirmLabel="Delete task"
        variant="destructive"
        onConfirm={onDelete}
      />

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard changes?"
        description="You have unsaved changes. If you leave now, they will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        variant="destructive"
        onConfirm={() => {
          setConfirmDiscard(false);
          cancelEdit();
        }}
      />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </dt>
      <dd className="text-sm text-right min-w-0 truncate">{value}</dd>
    </div>
  );
}

function LocalStatusBadge({ status }) {
  const styles = {
    todo: "bg-muted text-muted-foreground",
    in_progress: "bg-accent/25 text-accent-foreground",
    done: "bg-primary text-primary-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
        styles[status] || styles.todo
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function LocalPriorityBadge({ priority }) {
  const styles = {
    low: "bg-secondary/25 text-secondary-foreground",
    medium: "bg-muted text-muted-foreground",
    high: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
        styles[priority] || styles.medium
      }`}
    >
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}