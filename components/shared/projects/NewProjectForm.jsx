"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { useToast } from "@/contexts/ToastContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { api } from "@/lib/api";
import { validateProject, todayISO } from "@/lib/validation";

export function NewProjectForm({ role }) {
  const router = useRouter();
  const toast = useToast();
  const { currentWorkspaceId } = useWorkspace();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [dueDate, setDueDate] = useState("");
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
  const backHref = `/${role}/projects`;

  const validate = () => {
    const v = validateProject(
      { name, description, status, dueDate: dueDate || null },
      "create"
    );
    if (!v.ok) {
      toast.error(v.message);
      return null;
    }
    if (!currentWorkspaceId) {
      toast.error("No workspace selected.");
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
      const { project } = await api.post(`/api/${role}/projects`, {
        ...data,
        workspaceId: currentWorkspaceId,
      });
      setHasChanges(false);
      setConfirmOpen(false);
      toast.success(`Project "${project.name}" created`);
      router.push(backHref);
      router.refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to create project.");
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New project</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Start a new project and assign your team to it.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">
                Project name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Website Redesign"
                className="h-11"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  markChange();
                }}
                required
                maxLength={120}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this project about?"
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
                <Label>Initial status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v);
                    markChange();
                  }}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due">Due date</Label>
                <Input
                  id="due"
                  type="date"
                  className="h-11"
                  value={dueDate}
                  min={todayISO()}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    markChange();
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="h-11 px-6">
                {submitting ? "Creating…" : "Create project"}
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
        title="Create this project?"
        description={
          `You're about to create "${name.trim()}".` +
          (dueDate
            ? ` It's due on ${new Date(dueDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}.`
            : " No due date has been set.") +
          " You can change these details later."
        }
        confirmLabel={submitting ? "Creating…" : "Create project"}
        cancelLabel="Go back"
        loading={submitting}
        onConfirm={handleConfirmCreate}
      />

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={(open) => !open && cancelDiscard()}
        title="Discard changes?"
        description="You have unsaved changes. If you leave now, your project details will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        variant="destructive"
        onConfirm={confirmDiscard}
      />
    </div>
  );
}