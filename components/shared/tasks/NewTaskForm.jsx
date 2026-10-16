"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ArrowLeft } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { useToast } from "@/contexts/ToastContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useMembers } from "@/hooks/useMembers";
import { useProject } from "@/hooks/useProject";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { api } from "@/lib/api";
import { validateTask, todayISO } from "@/lib/validation";

const STATUS_VALUES = ["todo", "in_progress", "done"];
const PRIORITY_VALUES = ["low", "medium", "high"];
const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High" };
const STATUS_LABELS = { todo: "To Do", in_progress: "In Progress", done: "Done" };

function projectDueISO(project) {
  if (!project?.dueDate) return null;
  const d = new Date(project.dueDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function NewTaskForm({ role, slug }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { currentWorkspaceId } = useWorkspace();

  const { members, loading: membersLoading } = useMembers(role);
  const { project, loading: projectLoading } = useProject(role, slug);

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
  const backHref = `/${role}/projects/${slug}`;

  useEffect(() => {
    const s = searchParams.get("status");
    if (s && STATUS_VALUES.includes(s)) setStatus(s);
  }, [searchParams]);

  const minDate = todayISO();
  const projectDue = useMemo(() => projectDueISO(project), [project]);

  useEffect(() => {
    if (!dueDate) return;
    if (dueDate < minDate) setDueDate("");
    if (projectDue && dueDate > projectDue) setDueDate("");
  }, [dueDate, minDate, projectDue]);

  const selectedMember = members.find((m) => m.userId === assigneeId) || null;

  const validate = () => {
    const v = validateTask(
      {
        title,
        description,
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        projectId: project?.id,
      },
      "create",
      { projectDueDate: project?.dueDate || null }
    );
    if (!v.ok) {
      toast.error(v.message);
      return null;
    }
    if (!currentWorkspaceId) {
      toast.error("No workspace selected.");
      return null;
    }
    if (!project?.id) {
      toast.error("Project not loaded.");
      return null;
    }
    return v.value;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const handleConfirmCreate = async () => {
    const data = validate();
    if (!data) return;
    setSubmitting(true);
    try {
      await api.post(`/api/${role}/tasks`, {
        ...data,
        projectId: project.id,
        workspaceId: currentWorkspaceId,
      });
      setHasChanges(false);
      setConfirmOpen(false);
      toast.success("Task created");
      router.push(backHref);
      router.refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to create task.");
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    guard(() => router.push(backHref));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={backHref}
        onClick={handleCancel}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to project
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">New task</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {project
            ? `Add a task to ${project.name}.`
            : "Add a new task to this project."}
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
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v);
                    markChange();
                  }}
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
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => {
                    setPriority(v);
                    markChange();
                  }}
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
                />
              </div>

              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select
                  value={assigneeId || "none"}
                  onValueChange={(v) => {
                    setAssigneeId(v === "none" ? "" : v);
                    markChange();
                  }}
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
                    {members.map((m) => (
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
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting || projectLoading}
                className="h-11 px-6"
              >
                {submitting ? "Creating…" : "Create task"}
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
        title="Create this task?"
        description={
          `"${title.trim()}" will be added to the project` +
          (assigneeId
            ? ` and assigned to ${
                selectedMember?.name || "the selected member"
              }`
            : " as unassigned") +
          "."
        }
        confirmLabel={submitting ? "Creating…" : "Create task"}
        cancelLabel="Go back"
        loading={submitting}
        onConfirm={handleConfirmCreate}
      />

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={(open) => !open && cancelDiscard()}
        title="Discard changes?"
        description="You have unsaved changes. If you leave now, this task will not be created."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        variant="destructive"
        onConfirm={confirmDiscard}
      />
    </div>
  );
}