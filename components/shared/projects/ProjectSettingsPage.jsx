// components/shared/projects/ProjectSettingsPage.jsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { LoadingState } from "@/components/shared/ui/LoadingState";
import { useProject } from "@/hooks/useProject";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { validateProject, todayISO } from "@/lib/validation";
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react";

export function ProjectSettingsPage({ role, slug }) {
  const router = useRouter();
  const toast = useToast();
  const { project, loading, error, refresh } = useProject(role, slug);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit = role === "owner" || role === "admin";
  const canDelete = role === "owner";

  useEffect(() => {
    if (!project) return;
    setName(project.name || "");
    setDescription(project.description || "");
    setStatus(project.status || "active");
    setDueDate(project.dueDate ? project.dueDate.slice(0, 10) : "");
  }, [project]);

  const dirty =
    name.trim() !== (project?.name || "").trim() ||
    description !== (project?.description || "") ||
    status !== (project?.status || "active") ||
    (dueDate || "") !== (project?.dueDate ? project.dueDate.slice(0, 10) : "");

  const handleSave = async () => {
    const v = validateProject(
      { name, description, status, dueDate: dueDate || null },
      "update"
    );
    if (!v.ok) {
      toast.error(v.message);
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/${role}/projects/${slug}`, v.value);
      toast.success("Project updated");
      refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/${role}/projects/${slug}`);
      toast.success("Project deleted");
      router.push(`/${role}/projects`);
      router.refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to delete project");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <LoadingState label="Loading project…" />
      </div>
    );
  }

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  if (!project) {
    return <ErrorState error={{ message: "Project not found" }} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/${role}/projects/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to project
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update details or manage this project.
        </p>
      </div>

      <Card>
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-sm font-semibold">Project details</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            The name and description appear across the workspace.
          </p>
        </div>
        <Separator />
        <div className="px-6 py-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11"
              disabled={!canEdit}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={!canEdit}
                className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="planning">Planning</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due">Due date</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                min={todayISO()}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-11"
                disabled={!canEdit}
              />
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="h-10"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Save changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {canDelete && (
        <Card className="border-destructive/30">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-sm font-semibold text-destructive">
              Danger zone
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Deleting a project is permanent and can only be done when it has
              no tasks.
            </p>
          </div>
          <Separator />
          <div className="px-6 py-6">
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              className="h-10"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete project
            </Button>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this project?"
        description={`"${project.name}" will be permanently removed along with all its tasks, comments, and activity. This cannot be undone.`}
        confirmLabel={deleting ? "Deleting…" : "Delete project"}
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}