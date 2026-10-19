"use client";

import Link from "next/link";
import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { useToast } from "@/contexts/ToastContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMembers } from "@/hooks/useMembers";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { api } from "@/lib/api";
import { validateProject, todayISO } from "@/lib/validation";
import { ChevronDown } from "lucide-react";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function NewProjectForm({ role }) {
  const router = useRouter();
  const toast = useToast();
  const { currentWorkspaceId } = useWorkspace();
  const { user } = useAuth();
  const { members, loading: membersLoading } = useMembers(role);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [dueDate, setDueDate] = useState("");
  const [projectMemberIds, setProjectMemberIds] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { hasChanges, setHasChanges, dialogOpen, confirmDiscard, cancelDiscard, guard } = useUnsavedChanges();

  const markChange = () => setHasChanges(true);
  const backHref = `/${role}/projects`;

  // Dropdown state
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    markChange();
  };

  const selectedMembers = eligibleMembers.filter((m) => projectMemberIds.includes(m.userId));

  const validate = () => {
    const v = validateProject({ name, description, status, dueDate: dueDate || null }, "create");
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
        projectMemberIds,
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
              <Label htmlFor="name">Project name <span className="text-destructive">*</span></Label>
              <Input id="name" placeholder="e.g. Website Redesign" className="h-11" value={name} onChange={(e) => { setName(e.target.value); markChange(); }} required maxLength={120} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="What is this project about?" className="min-h-[100px]" value={description} onChange={(e) => { setDescription(e.target.value); markChange(); }} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Initial status</Label>
                <Select value={status} onValueChange={(v) => { setStatus(v); markChange(); }}>
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
                <Input id="due" type="date" className="h-11" value={dueDate} min={todayISO()} onChange={(e) => { setDueDate(e.target.value); markChange(); }} />
              </div>
            </div>

            <div className="space-y-2" ref={dropdownRef}>
              <Label>Assign team members</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedMembers.length > 0 ? (
                    <span className="truncate pr-4 text-left">
                      {selectedMembers.map((m) => m.name).join(", ")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Select members...</span>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </button>

                {isOpen && (
                  <div className="absolute z-50 mt-1 max-h-[250px] w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md p-1 animate-in fade-in-80 zoom-in-95">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Available Members</div>
                    <div className="h-px bg-border my-1 -mx-1" />
                    {membersLoading ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">Loading...</div>
                    ) : eligibleMembers.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">No members eligible to assign.</div>
                    ) : (
                      eligibleMembers.map((m) => (
                        <div
                          key={m.userId}
                          onClick={() => toggleMember(m.userId)}
                          className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={projectMemberIds.includes(m.userId)}
                            readOnly
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary mr-3 pointer-events-none"
                          />
                          <div className="flex items-center gap-2 w-full">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="bg-accent/20 text-accent-foreground text-[9px] font-semibold">{initials(m.name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">{m.name}</span>
                            <span className="text-xs text-muted-foreground capitalize ml-auto">{m.rawRole}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Only these members will be available to assign to tasks in this project.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="h-11 px-6">
                {submitting ? "Creating…" : "Create project"}
              </Button>
              <Button type="button" variant="outline" className="h-11 px-6" onClick={handleCancel} disabled={submitting}>
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
        description={`You're about to create "${name.trim()}". You can assign tasks to your team later.`}
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