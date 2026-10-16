// components/shared/projects/ProjectsPage.jsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/ui/PageHeader";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { RadialProgress } from "@/components/shared/ui/RadialProgress";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { ProjectCardMenu } from "@/components/shared/projects/ProjectCardMenu";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import {
  Plus,
  FolderKanban,
  Users,
  CalendarDays,
  ListChecks,
  ArrowUpRight,
} from "lucide-react";

function formatDue(value) {
  if (!value || value === "—") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusStyle(status) {
  const key = String(status || "").toLowerCase().replace(" ", "_");
  if (key === "active")
    return "bg-accent text-accent-foreground ring-accent/40";
  if (key === "planning")
    return "bg-accent/10 text-accent-foreground ring-accent/30";
  if (key === "on_hold" || key === "on hold")
    return "bg-muted text-muted-foreground ring-border";
  return "bg-secondary/15 text-secondary-foreground ring-border";
}

function ProjectCard({ project, role, index, onDeleteRequested }) {
  const due = formatDue(project.due);
  const taskCount = project.tasks || 0;
  const memberCount = project.members || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Card className="group relative h-full overflow-hidden border-border/70 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[0_12px_40px_-16px_var(--color-primary)]">
        <Link
          href={`/${role}/projects/${project.slug}`}
          className="absolute inset-0 z-10"
          aria-label={`Open ${project.name}`}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 w-40 h-40 rounded-full bg-accent/15 blur-3xl"
        />

        <div className="relative z-20 p-6 space-y-5 pointer-events-none">
          <div className="flex items-start justify-between gap-3 pointer-events-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${statusStyle(
                  project.status
                )}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                {project.status}
              </span>
              {due && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarDays className="w-3 h-3" />
                  {due}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <ProjectCardMenu
                role={role}
                project={project}
                onDeleteRequested={onDeleteRequested}
              />
              <span className="w-8 h-8 rounded-full bg-muted/40 border border-border flex items-center justify-center text-muted-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-45" />
              </span>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              <h3 className="text-lg font-bold tracking-tight leading-snug line-clamp-1">
                {project.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {project.description || "No description provided."}
              </p>
            </div>

            <div className="relative shrink-0">
              <RadialProgress
                value={project.progress}
                size={52}
                stroke={5}
                color="var(--color-accent)"
                trackColor="var(--color-border)"
              />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums">
                {project.progress}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-3 border-t border-dashed border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5" />
              <span className="tabular-nums">
                {taskCount} {taskCount === 1 ? "task" : "tasks"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span className="tabular-nums">
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function ProjectsPage({
  role,
  title = "Projects",
  description,
  canCreate = false,
}) {
  const toast = useToast();
  const { projects, loading, error, refresh } = useProjects(role);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const onDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/${role}/projects/${deleteTarget.slug}`);
      toast.success("Project deleted");
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description || "All projects in your workspace."}
        action={
          canCreate ? (
            <Button
              nativeButton={false}
              render={<Link href={`/${role}/projects/new`} />}
            >
              <Plus className="w-4 h-4 mr-2" /> New project
            </Button>
          ) : null
        }
      />

      {error ? (
        <Card>
          <ErrorState error={error} onRetry={refresh} />
        </Card>
      ) : loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description={
              canCreate
                ? "Create your first project to start organizing work."
                : "Projects you have access to will appear here."
            }
            action={
              canCreate ? (
                <Button
                  nativeButton={false}
                  render={<Link href={`/${role}/projects/new`} />}
                >
                  <Plus className="w-4 h-4 mr-2" /> New project
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              role={role}
              index={i}
              onDeleteRequested={(project) => setDeleteTarget(project)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
        title="Delete this project?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" and all of its tasks, comments, and activity will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel={deleting ? "Deleting…" : "Delete project"}
        variant="destructive"
        loading={deleting}
        onConfirm={onDeleteConfirmed}
      />
    </div>
  );
}