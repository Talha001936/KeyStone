"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuCheckboxItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { LoadingState } from "@/components/shared/ui/LoadingState";
import { useProject } from "@/hooks/useProject";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useMembers } from "@/hooks/useMembers";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { api } from "@/lib/api";
import { validateProject, todayISO } from "@/lib/validation";
import { ArrowLeft, Save, Loader2, ChevronDown } from "lucide-react";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function ProjectSettingsPage({ role, slug }) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { project, loading, error, refresh } = useProject(role, slug);
  const { members, loading: membersLoading } = useMembers(role);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [dueDate, setDueDate] = useState("");
  const [projectMemberIds, setProjectMemberIds] = useState([]);
  
  const [saving, setSaving] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);

  const { hasChanges, setHasChanges, dialogOpen, confirmDiscard, cancelDiscard, guard } = useUnsavedChanges();

  const canEdit = role === "owner" || role === "admin";
  const backHref = `/${role}/projects/${slug}`;

  useEffect(() => {
    if (!project) return;
    setName(project.name || "");
    setDescription(project.description || "");
    setStatus(project.status || "active");
    setDueDate(project.dueDate ? project.dueDate.slice(0, 10) : "");
    setProjectMemberIds(project.projectMemberIds || []);
    setHasChanges(false);
  }, [project, setHasChanges]);

  const eligibleMembers = useMemo(() => {
    return members.filter((m) => {
      if (m.userId === user?.id) return false;
      if (role === "admin") return m.rawRole === "member";
      if (role === "owner") return m.rawRole === "admin" || m.rawRole === "member";
      return false;
    });
  }, [members, role, user?.id]);

  const toggleMember = (userId) => {
    setProjectMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
    setHasChanges(true);
  };

  const selectedMembers = eligibleMembers.filter((m) => projectMemberIds.includes(m.userId));

  const dirty =
    name.trim() !== (project?.name || "").trim() ||
    description !== (project?.description || "") ||
    status !== (project?.status || "active") ||
    (dueDate || "") !== (project?.dueDate ? project.dueDate.slice(0, 10) : "") ||
    JSON.stringify([...projectMemberIds].sort()) !== JSON.stringify([...(project?.projectMemberIds || [])].sort());

  const markChange = () => setHasChanges(true);

  const validate = () => {
    const v = validateProject({ name, description, status, dueDate: dueDate || null }, "update");
    if (!v.ok) {
      toast.error(v.message);
      return null;
    }
    return v.value;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setConfirmSave(true);
  };

  const handleConfirmSave = async () => {
    const data = validate();
    if (!data) return;
    setSaving(true);
    try {
      await api.patch(`/api/${role}/projects/${slug}`, {
        ...data,
        projectMemberIds
      });
      setHasChanges(false);
      setConfirmSave(false);
      toast.success("Project updated");
      refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to update project");
      setConfirmSave(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    guard(() => router.push(backHref));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <LoadingState label="Loading project…" />
      </div>
    );
  }

  if (error) return <ErrorState error={error} onRetry={refresh} />;
  if (!project) return <ErrorState error={{ message: "Project not found" }} />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={backHref} onClick={handleCancel} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to project
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit project</h1>
        <p className="text-muted-foreground text-sm mt-1">Update details or manage this project.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Project name <span className="text-destructive">*</span></Label>
              <Input id="name" placeholder="e.g. Website Redesign" className="h-11" value={name} onChange={(e) => { setName(e.target.value); markChange(); }} required maxLength={120} disabled={!canEdit || saving} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="What is this project about?" className="min-h-[100px]" value={description} onChange={(e) => { setDescription(e.target.value); markChange(); }} disabled={!canEdit || saving} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => { setStatus(v); markChange(); }} disabled={!canEdit || saving}>
                  <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due">Due date</Label>
                <Input id="due" type="date" className="h-11" value={dueDate} min={todayISO()} onChange={(e) => { setDueDate(e.target.value); markChange(); }} disabled={!canEdit || saving} />
              </div>
            </div>

            {canEdit && (
              <div className="space-y-2">
                <Label>Assign team members</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button type="button" variant="outline" className="w-full h-11 justify-between font-normal" disabled={saving || membersLoading}>
                        {selectedMembers.length > 0 ? (
                          <span className="truncate">{selectedMembers.map((m) => m.name).join(", ")}</span>
                        ) : (
                          <span className="text-muted-foreground">Select members...</span>
                        )}
                        <ChevronDown className="w-4 h-4 opacity-50" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[250px] overflow-y-auto" align="start">
                    <DropdownMenuLabel>Available Members</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {eligibleMembers.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">No eligible members.</div>
                    ) : (
                      <DropdownMenuGroup>
                        {eligibleMembers.map((m) => (
                          <DropdownMenuCheckboxItem
                            key={m.userId}
                            checked={projectMemberIds.includes(m.userId)}
                            onCheckedChange={() => toggleMember(m.userId)}
                            onSelect={(e) => e.preventDefault()}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Avatar className="h-5 w-5"><AvatarFallback className="bg-accent/20 text-accent-foreground text-[9px] font-semibold">{initials(m.name)}</AvatarFallback></Avatar>
                              <span className="text-sm truncate">{m.name}</span>
                              <span className="text-xs text-muted-foreground capitalize ml-auto">{m.rawRole}</span>
                            </div>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuGroup>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="text-xs text-muted-foreground">Only these members will be available to assign to tasks.</p>
              </div>
            )}

            {canEdit && (
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={!dirty || saving} className="h-11 px-6">
                  {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>) : (<><Save className="w-4 h-4 mr-2" /> Save changes</>)}
                </Button>
                <Button type="button" variant="outline" className="h-11 px-6" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={(open) => !open && !saving && setConfirmSave(false)}
        title="Save changes?"
        description={`Update "${name.trim() || project.name}" with your changes?`}
        confirmLabel={saving ? "Saving…" : "Save changes"}
        cancelLabel="Keep editing"
        loading={saving}
        onConfirm={handleConfirmSave}
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