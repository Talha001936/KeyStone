"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { LoadingState } from "@/components/shared/ui/LoadingState";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMembers } from "@/hooks/useMembers";
import { useTask } from "@/hooks/useTask";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { api, ApiError } from "@/lib/api";
import { validateTask, todayISO } from "@/lib/validation";

const STATUS_VALUES = ["todo", "in_progress", "done"];
const PRIORITY_VALUES = ["low", "medium", "high"];
const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High" };
const STATUS_LABELS = { todo: "To Do", in_progress: "In Progress", done: "Done" };

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function EditTaskPage({ role, slug, taskNumber }) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const { task, role: callerRole, isAssignee, loading, error, refresh } =
    useTask(role, slug, taskNumber);

  const canEditAll = callerRole === "owner" || callerRole === "admin";
  const canChangeStatus = isAssignee;

  const { members, loading: membersLoading } = useMembers(role, {
    skip: !canEditAll,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    hasChanges,
    setHasChanges,
    dialogOpen,
    confirmDiscard,
    cancelDiscard,
    guard,
  } = useUnsavedChanges();

  const markChange = () => setHasChanges(true);
  const backHref = `/${role}/projects/${slug}/tasks/${taskNumber}`;

  useEffect(() => {
    if (!task) return;
    setTitle(task.title || "");
    setDescription(task.description || "");
    setStatus(task.status || "todo");
    setPriority(task.priority || "medium");
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setAssigneeId(task.assigneeId || "");
    setHasChanges(false);
  }, [task, setHasChanges]);

  // Filter assignable members based on caller role
  const assignableMembers = useMemo(() => {
    return members.filter((m) => {
      if (m.userId === user?.id) return false; // Do not assign to self
      if (role === "admin") return m.rawRole === "member";
      if (role === "owner") return m.rawRole === "admin" || m.rawRole === "member";
      return false;
    });
  }, [members, role, user?.id]);

  const minDate = todayISO();
  const projectDue = useMemo(() => {
    if (!task?.projectDueDate) return null;
    const d = new Date(task.projectDueDate);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }, [task?.projectDueDate]);

  useEffect(() => {
    if (!dueDate) return;
    if (dueDate < minDate) setDueDate("");
    if (projectDue && dueDate > projectDue) setDueDate("");
  }, [dueDate, minDate, projectDue]);

  // If the task is currently assigned to someone not in the filtered list
  // (e.g., owner assigned to admin, but admin is editing), we still want to show
  // their current name in the trigger, so fall back to the full members list.
  const selectedMember = 
    assignableMembers.find((m) => m.userId === assigneeId) || 
    members.find((m) => m.userId === assigneeId) || 
    null;

  const validate = () => {
    const payload = {
      title,
      description,
      priority,
      dueDate: dueDate || null,
    };
    if (canChangeStatus) payload.status = status;
    if (canEditAll) payload.assigneeId = assigneeId || null;

    const v = validateTask(payload, "update", {
      projectDueDate: task?.projectDueDate || null,
    });
    if (!v.ok) {
      toast.error(v.message);
      return null;
    }
    return v.value;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    const data = validate();
    if (!data) return;
    setSubmitting(true);
    try {
      await api.patch(`/api/${role}/projects/${slug}/tasks/${taskNumber}`, {
        ...data,
        _version: task.version,
      });
      setHasChanges(false);
      setConfirmOpen(false);
      toast.success("Task updated");
      router.push(backHref);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === "CONFLICT") {
        toast.error("Task was updated by someone else");
        refresh();
      } else {
        toast.error(err?.message || "Failed to save");
      }
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    guard(() => router.push(backHref));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <LoadingState label="Loading task…" />
      </div>
    );
  }

  if (error) return <ErrorState error={error} onRetry={refresh} />;
  if (!task)
    return <ErrorState error={{ message: "Task not found" }} onRetry={refresh} />;

  if (!canEditAll && !canChangeStatus) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to task
        </Link>
        <ErrorState
          error={{
            message:
              "You don't have permission to edit this task. Only the assignee or workspace admins can update it.",
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={backHref}
        onClick={handleCancel}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to task
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit task</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update the details of task #{task.displayNumber ?? taskNumber}.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Design new landing page"
                className="h-11"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markChange();
                }}
                required
                maxLength={200}
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the task…"
                className="min-h-[100px]"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  markChange();
                }}
                disabled={submitting}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {canChangeStatus && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => {
                      setStatus(v);
                      markChange();
                    }}
                    disabled={submitting}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_VALUES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => {
                    setPriority(v);
                    markChange();
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_VALUES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {canEditAll && (
                <div className="space-y-2">
                  <Label htmlFor="due">Due date</Label>
                  <Input
                    id="due"
                    type="date"
                    className="h-11"
                    value={dueDate}
                    min={minDate}
                    max={projectDue || undefined}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      markChange();
                    }}
                    disabled={submitting}
                  />
                </div>
              )}

              {canEditAll && (
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select
                    value={assigneeId || "none"}
                    onValueChange={(v) => {
                      setAssigneeId(v === "none" ? "" : v);
                      markChange();
                    }}
                    disabled={submitting || membersLoading}
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
                            <span className="text-xs text-muted-foreground capitalize">
                              · {selectedMember.rawRole}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {membersLoading ? "Loading members…" : "Unassigned"}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {assignableMembers.map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          <span className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="bg-muted text-foreground text-[9px] font-semibold">
                                {initials(m.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{m.name}</span>
                            <span className="text-xs text-muted-foreground capitalize">
                              · {m.rawRole}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 px-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 px-6"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => !open && !submitting && setConfirmOpen(false)}
        title="Save changes?"
        description={`Update task #${task.displayNumber ?? taskNumber} with your changes?`}
        confirmLabel={submitting ? "Saving…" : "Save changes"}
        cancelLabel="Keep editing"
        loading={submitting}
        onConfirm={handleConfirmSave}
      />

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={(open) => !open && cancelDiscard()}
        title="Discard changes?"
        description="You have unsaved changes. If you leave now, they will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        variant="destructive"
        onConfirm={confirmDiscard}
      />
    </div>
  );
}