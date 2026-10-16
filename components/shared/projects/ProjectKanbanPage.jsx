// components/shared/projects/ProjectKanbanPage.jsx
"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCorners,
} from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/shared/ui/StatCard";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { PriorityBadge } from "@/components/shared/tasks/PriorityBadge";
import { useProject } from "@/hooks/useProject";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useActivityStream } from "@/hooks/useActivityStream";
import { api, ApiError } from "@/lib/api";
import { TASK_STATUS, STATUS_LABELS } from "@/lib/constants";
import {
  Plus,
  MessageSquare,
  Clock,
  FolderKanban,
  Pencil,
} from "lucide-react";

const COLUMNS = [
  {
    id: TASK_STATUS.TODO,
    label: STATUS_LABELS.todo,
    accent: "bg-muted-foreground/60",
  },
  {
    id: TASK_STATUS.IN_PROGRESS,
    label: STATUS_LABELS.in_progress,
    accent: "bg-accent",
  },
  {
    id: TASK_STATUS.DONE,
    label: STATUS_LABELS.done,
    accent: "bg-primary",
  },
];

function TaskCard({ task }) {
  return (
    <Card
      className={`group border-border/60 hover:border-accent hover:shadow-md transition-all cursor-pointer bg-card ${
        task.isMine ? "ring-1 ring-accent/40" : ""
      }`}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground">
              #{task.displayNumber ?? "—"}
            </span>
            {task.isMine && (
              <span className="text-[10px] font-medium text-accent-foreground bg-accent/20 px-1.5 py-0.5 rounded">
                Mine
              </span>
            )}
          </div>
          <PriorityBadge priority={task.priority} />
        </div>

        <h4 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
          {task.title}
        </h4>

        {task.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-muted text-foreground text-[10px] font-semibold">
              {task.assigneeInitials}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            {task.comments > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {task.comments}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.due}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function DraggableTask({ task, role, slug }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={isDragging ? "opacity-40" : ""}
    >
      <Link
        href={`/${role}/projects/${slug}/tasks/${task.displayNumber}`}
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
      >
        <TaskCard task={task} />
      </Link>
    </div>
  );
}

function StaticTask({ task, role, slug }) {
  return (
    <Link href={`/${role}/projects/${slug}/tasks/${task.displayNumber}`}>
      <TaskCard task={task} />
    </Link>
  );
}

function KanbanColumn({ column, mode, canManage, slug, role, onAdd, children }) {
  const droppable = mode === "droppable";
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    disabled: !droppable,
  });

  return (
    <div
      ref={droppable ? setNodeRef : undefined}
      className={`flex flex-col rounded-2xl bg-muted/20 p-3 transition-colors ${
        droppable && isOver ? "ring-2 ring-accent/60" : ""
      }`}
    >
      <div className="flex items-center justify-between px-2 pb-3 mb-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.accent}`} />
          <h3 className="text-sm font-semibold">{column.label}</h3>
        </div>
        {canManage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onAdd}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

export function ProjectKanbanPage({ role, slug }) {
  const { project, tasks, loading, error, refresh } = useProject(role, slug);
  const { user } = useAuth();
  const toast = useToast();
  const [activeTask, setActiveTask] = useState(null);
  const canManage = role === "owner" || role === "admin";

  const anyDraggable = useMemo(
    () => tasks.some((t) => t.isMine === true),
    [tasks]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  /* Live SSE — refresh the board only. No toast for activity events. */
  const refreshTimerRef = useRef(null);
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) return;
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      refresh();
    }, 1500);
  }, [refresh]);

  useActivityStream(role, (a) => {
    if (!a?.project) return;
    if (user && a.actorName === user.name) return;
    scheduleRefresh();
  });

  const columns = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c.id, []]));
    for (const t of tasks) {
      (map[t.status] || map[TASK_STATUS.TODO]).push(t);
    }
    return COLUMNS.map((c) => ({ ...c, tasks: map[c.id] }));
  }, [tasks]);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === TASK_STATUS.DONE).length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === TASK_STATUS.IN_PROGRESS
  ).length;
  const progressPct = totalTasks
    ? Math.round((doneTasks / totalTasks) * 100)
    : 0;

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    if (!TASK_STATUS[newStatus.toUpperCase()]) return;
    if (!task.isMine) {
      toast.error("Only the assignee can change status");
      return;
    }

    try {
      await api.patch(
        `/api/${role}/projects/${slug}/tasks/${task.displayNumber}`,
        { status: newStatus, _version: task.version }
      );
      toast.success(`Task moved to ${STATUS_LABELS[newStatus]}`);
      refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === "CONFLICT") {
        toast.error("Task was updated by someone else");
      } else {
        toast.error(err.message || "Failed to update task");
      }
      refresh();
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-72 rounded-lg bg-muted/30 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((c) => (
            <div key={c} className="space-y-3">
              <div className="h-7 w-32 rounded-lg bg-muted/40 animate-pulse" />
              {[1, 2].map((k) => (
                <div
                  key={k}
                  className="h-32 rounded-xl bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <ErrorState error={error} onRetry={refresh} />
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <EmptyState
          icon={FolderKanban}
          title="Project not found"
          description="It may have been deleted or you don't have access."
        />
      </Card>
    );
  }

  const droppableMode = anyDraggable ? "droppable" : "static";

  const board = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {columns.map((col) => (
        <KanbanColumn
          key={col.id}
          column={col}
          mode={droppableMode}
          canManage={canManage}
          slug={slug}
          role={role}
          onAdd={() => {
            window.location.href = `/${role}/projects/${slug}/tasks/new?status=${col.id}`;
          }}
        >
          {col.tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No tasks
            </p>
          ) : (
            col.tasks.map((t) =>
              t.isMine ? (
                <DraggableTask key={t.id} task={t} role={role} slug={slug} />
              ) : (
                <StaticTask key={t.id} task={t} role={role} slug={slug} />
              )
            )
          )}

          {canManage && (
            <Link
              href={`/${role}/projects/${slug}/tasks/new?status=${col.id}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-accent hover:text-accent-foreground hover:bg-accent/5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add task
            </Link>
          )}
        </KanbanColumn>
      ))}
    </div>
  );

  const boardContent = anyDraggable ? (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveTask(e.active.data.current?.task)}
      onDragEnd={handleDragEnd}
    >
      {board}
      <DragOverlay>
        {activeTask ? (
          <div className="w-[300px] rotate-2">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  ) : (
    board
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Project
          </p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {project.description}
            </p>
          )}
        </div>
        {canManage && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/${role}/projects/${slug}/settings`} />}
            >
              <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
            </Button>
            <Button
              nativeButton={false}
              render={<Link href={`/${role}/projects/${slug}/tasks/new`} />}
            >
              <Plus className="w-4 h-4 mr-2" /> Add task
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Progress"
          value={`${progressPct}%`}
          hint={`${doneTasks} of ${totalTasks} done`}
          progress={progressPct}
        />
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          hint="Across all columns"
        />
        <StatCard
          label="In Progress"
          value={inProgressTasks}
          hint={
            totalTasks
              ? `${Math.round((inProgressTasks / totalTasks) * 100)}% of total`
              : "—"
          }
          progress={
            totalTasks ? Math.round((inProgressTasks / totalTasks) * 100) : 0
          }
        />
        <StatCard
          label="Done"
          value={doneTasks}
          hint={totalTasks ? `${progressPct}% completion` : "—"}
          progress={progressPct}
        />
      </div>

      {!anyDraggable && tasks.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">View only.</span> Only
          the <span className="font-medium text-foreground">assignee</span> of
          a task can change its status by dragging.
        </div>
      )}

      {boardContent}
    </div>
  );
}