// components/shared/dashboard/DashboardPage.jsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashboardStatCard } from "@/components/shared/dashboard/DashboardStatCard";
import { StatusBadge } from "@/components/shared/tasks/StatusBadge";
import { PriorityBadge } from "@/components/shared/tasks/PriorityBadge";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { RadialProgress } from "@/components/shared/ui/RadialProgress";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/useMembers";
import { useActivities } from "@/hooks/useActivities";
import { useActivityStream } from "@/hooks/useActivityStream";
import {
  ArrowRight,
  ListChecks,
  FolderKanban,
  CheckSquare,
  Layers,
  Activity as ActivityIcon,
  CircleDot,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
} from "lucide-react";

const stagger = (i) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.4,
    delay: Math.min(i * 0.06, 0.35),
    ease: [0.22, 1, 0.36, 1],
  },
});

function activityDotColor(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("created") || t.includes("added")) return "bg-accent";
  if (t.includes("deleted") || t.includes("removed")) return "bg-destructive";
  if (t.includes("status") || t.includes("comment")) return "bg-primary";
  if (t.includes("assignee") || t.includes("priority")) return "bg-secondary";
  return "bg-muted-foreground";
}

function statusPillClass(status) {
  const key = String(status || "").toLowerCase().replace(" ", "_");
  if (key === "active")
    return "bg-accent text-accent-foreground ring-accent/40";
  if (key === "planning")
    return "bg-accent/10 text-accent-foreground ring-accent/30";
  return "bg-muted text-muted-foreground ring-border";
}

export function DashboardPage({ role }) {
  const isMember = role === "member";

  /* -------- Data -------- */
  const { projects } = useProjects(role);

  // Members have no /api/member/team endpoint — skip entirely.
  const { members } = useMembers(role, { skip: isMember });

  const { total: totalTasks } = useTasks(role, { pageSize: 1 });
  const { total: inProgress } = useTasks(role, {
    pageSize: 1,
    filters: { status: "in_progress" },
  });
  const { total: done } = useTasks(role, {
    pageSize: 1,
    filters: { status: "done" },
  });
  const { total: todo } = useTasks(role, {
    pageSize: 1,
    filters: { status: "todo" },
  });

  const { tasks: recentTasks } = useTasks(role, {
    pageSize: 4,
    filters: {
      sort: isMember ? "due" : "created",
      order: isMember ? "asc" : undefined,
    },
  });

  const { activities: recentActivity, refresh } = useActivities(role, {
    pageSize: 4,
  });

  useActivityStream(role, () => refresh());

  /* -------- Derived -------- */
  const totalForPct = totalTasks || 0;
  const donePct = totalForPct ? Math.round((done / totalForPct) * 100) : 0;
  const inProgressPct = totalForPct
    ? Math.round((inProgress / totalForPct) * 100)
    : 0;
  const todoPct = totalForPct ? Math.round((todo / totalForPct) * 100) : 0;

  const topProjects = [...projects]
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 3);

  const teamSnapshot = members.slice(0, 4);
  const adminCount = members.filter((m) => m.rawRole === "admin").length;
  const memberCount = members.filter((m) => m.rawRole === "member").length;

  const statAccentPrimary = isMember ? "accent" : "primary";

  return (
    <div className="space-y-8">
      {/* ===== Hero header ===== */}
      <motion.div {...stagger(0)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground mb-3">
              <Sparkles className="w-3 h-3" />
              {isMember ? "My workspace" : "Workspace overview"}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isMember ? "My Tasks" : "Dashboard"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isMember
                ? "Here are the tasks assigned to you."
                : "A snapshot of your workspace, tasks, and team."}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground rounded-full border border-border bg-card px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </motion.div>

      {/* ===== Stat row ===== */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          index={0}
          label={isMember ? "Assigned to me" : "Total Tasks"}
          value={totalTasks}
          hint="Across all projects"
          icon={Layers}
          accent={statAccentPrimary}
        />
        <DashboardStatCard
          index={1}
          label="In Progress"
          value={inProgress}
          hint={totalForPct ? `${inProgressPct}% of total` : "—"}
          progress={inProgressPct}
          icon={Clock}
          accent="accent"
        />
        <DashboardStatCard
          index={2}
          label="Completed"
          value={done}
          hint={totalForPct ? `${donePct}% completion` : "—"}
          progress={donePct}
          icon={CheckCircle2}
          accent="primary"
        />
        <DashboardStatCard
          index={3}
          label={isMember ? "To Do" : "Team Members"}
          value={isMember ? todo : members.length}
          hint={
            isMember
              ? "Waiting to start"
              : `${adminCount} admin · ${memberCount} members`
          }
          icon={isMember ? CircleDot : ActivityIcon}
          accent="muted"
        />
      </div>

      {/* ===== Middle row ===== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task breakdown */}
        <motion.div {...stagger(4)} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Task breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                {todoPct > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${todoPct}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-muted-foreground/50"
                  />
                )}
                {inProgressPct > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${inProgressPct}%` }}
                    transition={{
                      duration: 0.6,
                      delay: 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="bg-accent"
                  />
                )}
                {donePct > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${donePct}%` }}
                    transition={{
                      duration: 0.6,
                      delay: 0.2,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="bg-primary"
                  />
                )}
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "To Do",
                    value: todo,
                    pct: todoPct,
                    color: "bg-muted-foreground/50",
                  },
                  {
                    label: "In Progress",
                    value: inProgress,
                    pct: inProgressPct,
                    color: "bg-accent",
                  },
                  {
                    label: "Done",
                    value: done,
                    pct: donePct,
                    color: "bg-primary",
                  },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full ${b.color} shrink-0`}
                      />
                      <span className="text-sm">{b.label}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-medium tabular-nums">
                        {b.value}
                      </span>
                      <span className="text-xs text-muted-foreground w-9 text-right tabular-nums">
                        {b.pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between group/btn -mx-2 px-2"
                nativeButton={false}
                render={<Link href={`/${role}/tasks`} />}
              >
                View all tasks
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project progress */}
        <motion.div {...stagger(5)} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Project progress</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href={`/${role}/projects`} />}
                className="group/btn"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-2">
              {topProjects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="No projects yet"
                  description={
                    isMember
                      ? "Projects you're a part of will appear here."
                      : "Create a project to see progress here."
                  }
                />
              ) : (
                <div className="divide-y divide-border/70">
                  {topProjects.map((p, i) => {
                    const taskCount = p.tasks || 0;
                    const progress = p.progress || 0;
                    const hasTasks = taskCount > 0;

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.35,
                          delay: 0.15 + i * 0.06,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="group/row flex items-center gap-4 py-4 first:pt-3 last:pb-3"
                      >
                        <div className="relative shrink-0">
                          <RadialProgress
                            value={progress}
                            size={52}
                            stroke={5}
                            color="var(--color-accent)"
                            trackColor="var(--color-border)"
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums text-foreground">
                            {progress}%
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2 min-w-0">
                            <Link
                              href={`/${role}/projects/${p.slug}`}
                              className="text-sm font-semibold truncate hover:underline"
                            >
                              {p.name}
                            </Link>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset shrink-0 ${statusPillClass(
                                p.status
                              )}`}
                            >
                              <span className="w-1 h-1 rounded-full bg-current opacity-70" />
                              {p.status}
                            </span>
                          </div>

                          {hasTasks ? (
                            <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{
                                  duration: 0.6,
                                  delay: 0.25 + i * 0.06,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                className="h-full rounded-full bg-accent"
                              />
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">
                              No tasks yet — add one to start tracking
                              progress.
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold tabular-nums">
                            {taskCount}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {taskCount === 1 ? "task" : "tasks"}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ===== Bottom row ===== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent tasks */}
        <motion.div {...stagger(6)} className="lg:col-span-2">
          <Card className="h-full overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent tasks</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href={`/${role}/tasks`} />}
                className="group/btn"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentTasks.length === 0 ? (
                <EmptyState
                  icon={isMember ? CheckSquare : ListChecks}
                  title={isMember ? "No tasks assigned" : "No tasks yet"}
                  description={
                    isMember
                      ? "When tasks are assigned to you, they'll appear here."
                      : "Tasks will show up here once created."
                  }
                />
              ) : (
                <div className="divide-y divide-border/60">
                  {recentTasks.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
                    >
                      <Link
                        href={`/${role}/projects/${t.projectSlug}/tasks/${t.displayNumber}`}
                        className="group/row flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                      >
                        <span className="shrink-0 w-9 h-9 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-xs font-mono font-semibold text-muted-foreground group-hover/row:bg-accent/15 group-hover/row:border-accent/40 group-hover/row:text-accent-foreground transition-colors">
                          #{t.displayNumber ?? "—"}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate leading-snug">
                            {t.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {t.project}
                            {isMember && t.due ? ` · Due ${t.due}` : ""}
                          </p>
                        </div>

                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                          <PriorityBadge priority={t.priority} />
                          <StatusBadge status={t.status} />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent activity */}
        <motion.div {...stagger(7)} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent activity</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href={`/${role}/activity`} />}
                className="group/btn"
              >
                All
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-2">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No activity yet.
                </p>
              ) : (
                <div className="relative">
                  <div
                    aria-hidden
                    className="absolute left-[7px] top-3 bottom-3 w-px bg-border"
                  />

                  <div className="space-y-4">
                    {recentActivity.map((a, i) => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
                        className="relative flex items-start gap-3"
                      >
                        <span
                          className={`relative z-10 mt-1.5 w-3.5 h-3.5 rounded-full ring-4 ring-card shrink-0 ${activityDotColor(
                            a.type
                          )}`}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-xs leading-relaxed">
                            <span className="font-semibold">
                              {a.actorName}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {a.detail}
                            </span>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {a.createdAt
                              ? new Date(a.createdAt).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                )
                              : ""}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ===== Team snapshot (hidden for members) ===== */}
      {!isMember && (
        <motion.div {...stagger(8)}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Team snapshot</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href={`/${role}/team`} />}
                className="group/btn"
              >
                Manage team
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {teamSnapshot.length === 0 ? (
                <p className="text-xs text-muted-foreground col-span-full text-center py-4">
                  No members yet.
                </p>
              ) : (
                teamSnapshot.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-accent/20 text-foreground text-xs font-semibold">
                        {m.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.role}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}