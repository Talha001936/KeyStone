// components/shared/tasks/TaskDetailPage.jsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
import { api, ApiError } from "@/lib/api";
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
  Clock,
} from "lucide-react";
import { STATUS_LABELS, PRIORITY_LABELS, TASK_STATUS } from "@/lib/constants";

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

  const canEditAll = callerRole === "owner" || callerRole === "admin";
  const canChangeStatus = isAssignee;
  const canDelete = canEditAll;
  const canComment = isAssignee || canEditAll;

  const { comments, loading: commentsLoading, addComment } = useTaskComments(
    role,
    slug,
    taskNumber,
    { skip: !canComment }
  );

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  const onUpdateStatus = async (newStatus) => {
    if (newStatus === task.status) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/api/${role}/projects/${slug}/tasks/${taskNumber}`, {
        status: newStatus,
        _version: task.version,
      });
      toast.success(`Status changed to ${STATUS_LABELS[newStatus]}`);
      refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === "CONFLICT") {
        toast.error("Task was updated by someone else");
        refresh();
      } else {
        toast.error(err.message || "Failed to update status");
      }
    } finally {
      setUpdatingStatus(false);
    }
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <Link
        href={`/${role}/projects/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to project
      </Link>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="space-y-3 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-mono font-semibold text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md">
              #{task.displayNumber ?? "—"}
            </span>
            
            {/* If assignee, show status dropdown. Otherwise, show static pill. */}
            {canChangeStatus && !canEditAll ? (
              <div className="relative z-10">
                <Select
                  value={task.status}
                  onValueChange={onUpdateStatus}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className={`h-8 px-3 py-1 rounded-full border-0 font-semibold uppercase tracking-wider text-xs ring-1 ring-inset focus:ring-2 ${getStatusStyles(task.status)}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TASK_STATUS.TODO}>To Do</SelectItem>
                    <SelectItem value={TASK_STATUS.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TASK_STATUS.DONE}>Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getStatusStyles(task.status)}`}>
                {STATUS_LABELS[task.status] || task.status}
              </span>
            )}

            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getPriorityStyles(task.priority)}`}>
              {PRIORITY_LABELS[task.priority] || task.priority}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {task.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Only Owner/Admin can edit all details */}
          {canEditAll && (
            <Button
              variant="outline"
              className="h-10 px-5 shadow-sm font-semibold"
              nativeButton={false}
              render={<Link href={`/${role}/projects/${slug}/tasks/${taskNumber}/edit`} />}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              className="h-10 px-5 shadow-sm font-semibold"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 border-border/60 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Description
            </h2>
            {task.description ? (
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                {task.description}
              </p>
            ) : (
              <p className="text-[15px] text-muted-foreground italic">
                No description provided.
              </p>
            )}
          </Card>

          <Card className="p-8 border-border/60 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Comments {comments.length > 0 && `(${comments.length})`}
              </h2>
            </div>

            {canComment ? (
              <div className="space-y-6">
                {commentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
                    ))}
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4">
                    No comments yet. Start the conversation.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-4">
                        <Avatar className="h-10 w-10 shrink-0 shadow-sm border border-border/50">
                          <AvatarFallback className="bg-accent/20 text-accent-foreground text-sm font-bold">
                            {c.authorInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 bg-muted/20 rounded-2xl rounded-tl-sm p-4 border border-border/40">
                          <div className="flex items-baseline gap-3 mb-2">
                            <span className="text-sm font-bold text-foreground">
                              {c.authorName}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {relativeTime(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-[14px] whitespace-pre-wrap break-words leading-relaxed text-foreground/80">
                            {c.body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-6 border-t border-border/60 mt-6">
                  <Textarea
                    placeholder="Write a comment…"
                    className="min-h-[100px] bg-muted/10 resize-none rounded-xl focus-visible:ring-accent/50"
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    maxLength={5000}
                    disabled={posting}
                  />
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={onPostComment}
                      disabled={posting || !commentBody.trim()}
                      className="h-10 px-6 font-semibold shadow-sm"
                    >
                      {posting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Posting…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Post comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-xl border border-border/50">
                <Lock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Only the assignee and workspace admins can view or post comments on this task.
                </p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-border/60 shadow-sm bg-card">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5">
              Task Details
            </h2>
            <div className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Task ID
                </span>
                <span className="text-sm font-mono font-medium">{task.code}</span>
              </div>
              <Separator className="bg-border/50" />
              
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" /> Priority
                </span>
                <span className={`inline-flex items-center w-fit rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${getPriorityStyles(task.priority)}`}>
                  {PRIORITY_LABELS[task.priority] || task.priority}
                </span>
              </div>
              <Separator className="bg-border/50" />

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Assignee
                </span>
                {task.assigneeName ? (
                  <div className="flex items-center gap-2.5 bg-muted/20 p-2 rounded-lg border border-border/40">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {task.assigneeInitials || initials(task.assigneeName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">{task.assigneeName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic bg-muted/20 p-2 rounded-lg border border-border/40">Unassigned</span>
                )}
              </div>
              <Separator className="bg-border/50" />

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Due date
                </span>
                <span className="text-sm font-medium text-foreground">
                  {task.dueDate ? formatDate(task.dueDate) : "—"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete task?"
        description="This task and its activity history will be permanently removed. This cannot be undone."
        confirmLabel="Delete task"
        variant="destructive"
        onConfirm={onDelete}
      />
    </div>
  );
}

function getStatusStyles(status) {
  switch (status) {
    case "todo":
      return "bg-muted text-muted-foreground ring-1 ring-border";
    case "in_progress":
      return "bg-accent/20 text-accent-foreground ring-1 ring-accent/30";
    case "done":
      return "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary";
    default:
      return "bg-muted text-muted-foreground ring-1 ring-border";
  }
}

function getPriorityStyles(priority) {
  switch (priority) {
    case "low":
      return "bg-secondary/20 text-secondary-foreground ring-1 ring-secondary/30";
    case "medium":
      return "bg-muted text-muted-foreground ring-1 ring-border";
    case "high":
      return "bg-destructive/10 text-destructive ring-1 ring-destructive/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}