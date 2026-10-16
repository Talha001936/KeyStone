// components/shared/tasks/TasksListPage.jsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/ui/PageHeader";
import { SearchInput } from "@/components/shared/ui/SearchInput";
import { Pagination } from "@/components/shared/ui/Pagination";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { StatusBadge } from "@/components/shared/tasks/StatusBadge";
import { PriorityBadge } from "@/components/shared/tasks/PriorityBadge";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { useTasks } from "@/hooks/useTasks";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import {
  ListChecks,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";

function formatDate(value) {
  if (!value || value === "—") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TasksListPage({
  role,
  title = "All Tasks",
  description = "Every task across all projects in your workspace.",
  showAssignee = true,
  showNewTask = true,
}) {
  const toast = useToast();
  const { filters, setFilter, setFilters } = useUrlFilters({
    q: "",
    status: "",
    priority: "",
    assigneeId: "",
    page: "1",
  });

  const page = Math.max(1, parseInt(filters.page || "1", 10) || 1);
  const pageSize = 20;

  const query = useMemo(
    () => ({
      q: filters.q || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      assigneeId: filters.assigneeId || undefined,
      sort: "created",
      order: "asc",
    }),
    [filters.q, filters.status, filters.priority, filters.assigneeId]
  );

  const { tasks, total, loading, error, refresh } = useTasks(role, {
    filters: query,
    page,
    pageSize,
  });

  const hasFilters = !!(
    filters.q ||
    filters.status ||
    filters.priority ||
    filters.assigneeId
  );

  const canEdit = role === "owner" || role === "admin";
  const canDelete = role === "owner" || role === "admin";

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const onDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(
        `/api/${role}/projects/${deleteTarget.projectSlug}/tasks/${deleteTarget.displayNumber}`
      );
      toast.success("Task deleted");
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  const COL = {
    num: "w-[56px] shrink-0",
    task: "flex-1 min-w-0",
    project: showAssignee
      ? "w-[180px] shrink-0 hidden lg:block"
      : "w-[220px] shrink-0 hidden lg:block",
    assignee: "w-[160px] shrink-0 hidden lg:flex items-center gap-2",
    status: "w-[130px] shrink-0 hidden lg:block",
    due: "w-[110px] shrink-0 hidden lg:block text-right",
    actions: "w-[44px] shrink-0 flex justify-end",
  };

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <div className="flex flex-wrap gap-3">
        <SearchInput
          value={filters.q}
          onChange={(e) => setFilter("q", e.target.value)}
          placeholder="Search by title…"
        />

        <Select
          value={filters.status || "all"}
          onValueChange={(v) => setFilter("status", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-10 w-[170px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.priority || "all"}
          onValueChange={(v) => setFilter("priority", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-10 w-[160px]">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10"
            onClick={() =>
              setFilters({ q: "", status: "", priority: "", assigneeId: "" })
            }
          >
            Clear filters
          </Button>
        )}
      </div>

      {error ? (
        <Card>
          <ErrorState error={error} onRetry={refresh} />
        </Card>
      ) : loading ? (
        <Card className="p-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </Card>
      ) : tasks.length === 0 ? (
        <Card>
          <EmptyState
            icon={ListChecks}
            title={hasFilters ? "No tasks match your filters" : "No tasks yet"}
            description={
              hasFilters
                ? "Try adjusting or clearing your filters."
                : "Tasks will appear here once they're created."
            }
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({ q: "", status: "", priority: "" })
                  }
                >
                  Clear filters
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="hidden lg:flex items-center gap-4 px-6 py-3 border-b bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className={COL.num}>#</span>
              <span className={COL.task}>Task</span>
              <span className={COL.project}>Project</span>
              {showAssignee && <span className={COL.assignee}>Assignee</span>}
              <span className={COL.status}>Status</span>
              <span className={COL.due}>Due</span>
              <span className={COL.actions}>Actions</span>
            </div>

            <div className="divide-y">
              <AnimatePresence initial={false}>
                {tasks.map((t, i) => {
                  const taskHref = `/${role}/projects/${t.projectSlug}/tasks/${t.displayNumber}`;
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{
                        duration: 0.25,
                        delay: Math.min(i * 0.03, 0.25),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="group/row relative"
                    >
                      <Link
                        href={taskHref}
                        className="absolute inset-0 z-0"
                        aria-label={`Open task #${t.displayNumber ?? ""} ${t.title}`}
                      />

                      <div className="hidden lg:flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                        <span
                          className={`${COL.num} font-mono text-xs text-muted-foreground pointer-events-none`}
                        >
                          #{t.displayNumber ?? "—"}
                        </span>
                        <div className={`${COL.task} pointer-events-none`}>
                          <p className="text-sm font-medium truncate">
                            {t.title}
                          </p>
                        </div>
                        <span
                          className={`${COL.project} text-sm text-muted-foreground truncate pointer-events-none`}
                        >
                          {t.project}
                        </span>
                        {showAssignee && (
                          <div className={`${COL.assignee} pointer-events-none`}>
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="bg-muted text-foreground text-[10px] font-semibold">
                                {t.assigneeInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">
                              {t.assignee}
                            </span>
                          </div>
                        )}
                        <div className={`${COL.status} pointer-events-none`}>
                          <StatusBadge status={t.status} />
                        </div>
                        <span
                          className={`${COL.due} text-sm text-muted-foreground whitespace-nowrap pointer-events-none`}
                        >
                          {formatDate(t.due)}
                        </span>
                        <div className={`${COL.actions} relative z-20`}>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground opacity-50 group-hover/row:opacity-100 hover:bg-muted transition-opacity"
                                  aria-label="Open task actions"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                nativeButton={false}
                                render={<Link href={taskHref} />}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open task
                              </DropdownMenuItem>

                              {canEdit && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    nativeButton={false}
                                    render={<Link href={taskHref} />}
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit task
                                  </DropdownMenuItem>
                                </>
                              )}

                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDeleteTarget(t);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete task
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="lg:hidden px-6 py-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-xs text-muted-foreground">
                              #{t.displayNumber ?? "—"}
                            </span>
                            <p className="text-sm font-medium truncate mt-0.5">
                              {t.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {t.project}
                            </p>
                          </div>

                          <div className="relative z-20 shrink-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground"
                                    aria-label="Open task actions"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  nativeButton={false}
                                  render={<Link href={taskHref} />}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Open task
                                </DropdownMenuItem>
                                {canEdit && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      nativeButton={false}
                                      render={<Link href={taskHref} />}
                                    >
                                      <Pencil className="w-4 h-4 mr-2" />
                                      Edit task
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {canDelete && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeleteTarget(t);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete task
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <PriorityBadge priority={t.priority} />
                          <StatusBadge status={t.status} />
                          <span className="text-xs text-muted-foreground">
                            Due {formatDate(t.due)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </Card>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setFilter("page", String(p))}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
        title="Delete this task?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" (#${deleteTarget.displayNumber ?? "—"}) will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel={deleting ? "Deleting…" : "Delete task"}
        variant="destructive"
        loading={deleting}
        onConfirm={onDeleteConfirmed}
      />
    </div>
  );
}