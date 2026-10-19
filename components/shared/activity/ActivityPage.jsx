// components/shared/activity/ActivityPage.jsx
"use client";

import { useMemo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/ui/PageHeader";
import { SearchInput } from "@/components/shared/ui/SearchInput";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { Pagination } from "@/components/shared/ui/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivities } from "@/hooks/useActivities";
import { useActivityStream } from "@/hooks/useActivityStream";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  Activity as ActivityIcon,
  Plus,
  ArrowRight,
  UserPlus,
  Flag,
  Trash2,
  MessageSquare,
  FolderPlus,
  Pencil,
  FolderMinus,
  Users,
  UserMinus,
  Shield,
} from "lucide-react";

const META = {
  task_created: { icon: Plus, badge: "bg-gradient-to-br from-accent to-accent/70 text-accent-foreground", glow: "bg-accent/30" },
  status_changed: { icon: ArrowRight, badge: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground", glow: "bg-primary/25" },
  assignee_changed: { icon: UserPlus, badge: "bg-gradient-to-br from-accent to-accent/70 text-accent-foreground", glow: "bg-accent/30" },
  priority_changed: { icon: Flag, badge: "bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground", glow: "bg-secondary/25" },
  task_deleted: { icon: Trash2, badge: "bg-gradient-to-br from-destructive to-destructive/70 text-destructive-foreground", glow: "bg-destructive/25" },
  comment_added: { icon: MessageSquare, badge: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground", glow: "bg-primary/25" },
  project_created: { icon: FolderPlus, badge: "bg-gradient-to-br from-accent to-accent/70 text-accent-foreground", glow: "bg-accent/30" },
  project_updated: { icon: Pencil, badge: "bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground", glow: "bg-secondary/25" },
  project_deleted: { icon: FolderMinus, badge: "bg-gradient-to-br from-destructive to-destructive/70 text-destructive-foreground", glow: "bg-destructive/25" },
  member_invited: { icon: UserPlus, badge: "bg-gradient-to-br from-accent to-accent/70 text-accent-foreground", glow: "bg-accent/30" },
  member_joined: { icon: Users, badge: "bg-gradient-to-br from-accent to-accent/70 text-accent-foreground", glow: "bg-accent/30" },
  member_removed: { icon: UserMinus, badge: "bg-gradient-to-br from-destructive to-destructive/70 text-destructive-foreground", glow: "bg-destructive/25" },
  role_swapped: { icon: Shield, badge: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground", glow: "bg-primary/25" },
  member_status_changed: { icon: Users, badge: "bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground", glow: "bg-secondary/25" },
  ownership_transferred: { icon: Shield, badge: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground", glow: "bg-primary/25" },
  workspace_created: { icon: FolderPlus, badge: "bg-gradient-to-br from-accent to-accent/70 text-accent-foreground", glow: "bg-accent/30" },
  workspace_updated: { icon: Pencil, badge: "bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground", glow: "bg-secondary/25" },
};

const FALLBACK_META = {
  icon: ActivityIcon,
  badge: "bg-gradient-to-br from-muted to-muted/70 text-muted-foreground",
  glow: "bg-muted/40",
};

function metaFor(type) {
  return META[type] || FALLBACK_META;
}

// These are the prefix phrases used before the detail string
const ACTIONS = {
  task_created: "created",
  status_changed: "changed status on",
  assignee_changed: "reassigned",
  priority_changed: "changed priority on",
  task_deleted: "deleted",
  comment_added: "commented on",
  project_created: "created project",
  project_updated: "updated project",
  project_deleted: "deleted project",
  member_invited: "invited",
  member_joined: "added",
  member_removed: "removed",
  member_role_changed: "changed role of",
  member_status_changed: "updated status of",
  role_swapped: "changed admin to",
  ownership_transferred: "transferred ownership to",
  workspace_created: "created workspace",
  workspace_updated: "renamed workspace to",
};

function actionFor(type) {
  return ACTIONS[type] || String(type || "").replace(/_/g, " ");
}

function groupByDay(items) {
  const map = new Map();
  for (const a of items) {
    const d = a.createdAt ? new Date(a.createdAt) : null;
    const key = d
      ? `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      : "unknown";
    if (!map.has(key)) map.set(key, { key, date: d, items: [] });
    map.get(key).items.push(a);
  }
  return Array.from(map.values());
}

function labelForDay(date) {
  if (!date) return "Unknown";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function relativeTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const sec = Math.max(1, Math.floor(diff / 1000));
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60) return "Just now";
  if (min < 60) return `${min} Minute${min === 1 ? "" : "s"} Ago`;
  if (hr < 24) return `${hr} Hour${hr === 1 ? "" : "s"} Ago`;
  if (day === 1) return "Yesterday";
  if (day < 30) return `${day} Days Ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const TYPE_OPTIONS = [
  { value: "task_created", label: "Task created" },
  { value: "status_changed", label: "Status changed" },
  { value: "assignee_changed", label: "Assignee changed" },
  { value: "priority_changed", label: "Priority changed" },
  { value: "task_deleted", label: "Task deleted" },
  { value: "comment_added", label: "Comment added" },
  { value: "project_created", label: "Project created" },
  { value: "project_updated", label: "Project updated" },
  { value: "project_deleted", label: "Project deleted" },
  { value: "member_invited", label: "Member invited" },
  { value: "member_joined", label: "Member joined" },
  { value: "member_removed", label: "Member removed" },
  { value: "role_swapped", label: "Role changed" },
];

const groupVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.045, delayChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, x: -10, scale: 0.99 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 340, damping: 26, mass: 0.6 } },
  exit: { opacity: 0, x: -6, transition: { duration: 0.18 } },
};

const dividerVariant = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function ActivityPage({ role, title = "Activity", description }) {
  const { filters, setFilter, setFilters } = useUrlFilters({
    type: "",
    page: "1",
  });
  const [search, setSearch] = useState("");
  const [liveNew, setLiveNew] = useState([]);

  const page = Math.max(1, parseInt(filters.page || "1", 10) || 1);
  const pageSize = 20;

  const query = useMemo(
    () => ({ type: filters.type || undefined }),
    [filters.type]
  );

  const { activities, total, loading, error, refresh } = useActivities(role, {
    filters: query,
    page,
    pageSize,
  });

  const onLiveActivity = useCallback(
    (a) => {
      if (page !== 1) return;
      if (filters.type && a.type !== filters.type) return;
      setLiveNew((prev) => {
        if (prev.some((x) => x.id === a.id)) return prev;
        return [a, ...prev].slice(0, 5);
      });
      setTimeout(() => {
        setLiveNew([]);
        refresh();
      }, 8000);
    },
    [page, filters.type, refresh]
  );

  useActivityStream(role, onLiveActivity);

  const combined = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const a of liveNew) {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        out.push({ ...a, _live: true });
      }
    }
    for (const a of activities) {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        out.push(a);
      }
    }
    return out;
  }, [liveNew, activities]);

  const visible = useMemo(() => {
    if (!search.trim()) return combined;
    const q = search.trim().toLowerCase();
    return combined.filter(
      (a) =>
        (a.actorName || "").toLowerCase().includes(q) ||
        (a.detail || "").toLowerCase().includes(q) ||
        (a.project || "").toLowerCase().includes(q)
    );
  }, [combined, search]);

  const groups = useMemo(() => groupByDay(visible), [visible]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description || "Every change in your workspace, chronologically."}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center gap-3"
      >
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search activity…"
        />

        <Select
          value={filters.type || "all"}
          onValueChange={(v) => setFilter("type", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-10 w-[190px]">
            <SelectValue placeholder="All activity types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activity types</SelectItem>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <AnimatePresence>
          {filters.type && (
            <motion.button
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.2 }}
              onClick={() => setFilters({ type: "" })}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {error ? (
        <Card>
          <ErrorState error={error} onRetry={refresh} />
        </Card>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15,
              }}
              className="h-20 rounded-2xl bg-muted/30"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Changes to tasks and projects will appear here."
          />
        </Card>
      ) : (
        <>
          <div className="space-y-10">
            {groups.map((group) => (
              <motion.div
                key={group.key}
                variants={groupVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="relative flex items-center justify-center mb-6">
                  <motion.div
                    variants={dividerVariant}
                    className="absolute left-0 right-1/2 h-px bg-border/70 origin-right"
                  />
                  <motion.div
                    variants={dividerVariant}
                    className="absolute left-1/2 right-0 h-px bg-border/70 origin-left"
                  />
                  <motion.span
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="relative px-4 bg-background text-xs font-medium text-muted-foreground"
                  >
                    {labelForDay(group.date)}
                  </motion.span>
                </div>

                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {group.items.map((a) => {
                      const meta = metaFor(a.type);
                      const Icon = meta.icon;
                      const action = actionFor(a.type);

                      return (
                        <motion.div
                          key={a.id}
                          variants={cardVariants}
                          layout
                          whileHover={{ y: -2 }}
                          className="group relative flex items-start gap-4 rounded-2xl bg-card/60 border border-border/60 px-5 py-4 hover:bg-card hover:border-border hover:shadow-[0_6px_20px_-12px_rgba(70,63,58,0.15)] transition-[background-color,border-color,box-shadow] duration-300"
                        >
                          {a._live && (
                            <motion.span
                              aria-hidden
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{
                                opacity: [0, 1, 0],
                                scale: [0.6, 1.4, 1.8],
                              }}
                              transition={{ duration: 1.4, repeat: 2 }}
                              className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent"
                            />
                          )}

                          <motion.div
                            className="relative shrink-0 mt-0.5"
                            whileHover={{ scale: 1.06 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 20,
                            }}
                          >
                            <motion.div
                              aria-hidden
                              className={`absolute inset-0 rounded-full blur-lg ${meta.glow}`}
                              animate={{ opacity: [0.5, 0.75, 0.5] }}
                              transition={{
                                duration: 3.2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                            <motion.div
                              className={`relative w-11 h-11 rounded-full flex items-center justify-center shadow-sm ${meta.badge}`}
                              whileHover={{ rotate: -4 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 18,
                              }}
                            >
                              <Icon className="w-5 h-5" strokeWidth={2} />
                            </motion.div>
                          </motion.div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
                              <span className="font-medium">
                                {a.actorName || "System"}
                              </span>
                              <span className="opacity-50">·</span>
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                              >
                                {relativeTime(a.createdAt)}
                              </motion.span>
                            </div>

                            <p className="text-sm leading-relaxed">
                              <span className="text-muted-foreground">
                                {action}
                              </span>
                              {a.detail && (
                                <>
                                  {" "}
                                  <span className="font-semibold">{a.detail}</span>
                                </>
                              )}
                            </p>

                            {a.project && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.15 }}
                                className="text-[11px] text-muted-foreground mt-1.5"
                              >
                                in{" "}
                                <span className="text-foreground">
                                  {a.project}
                                </span>
                              </motion.p>
                            )}
                          </div>

                          <motion.div
                            aria-hidden
                            className="self-center w-1.5 h-1.5 rounded-full bg-accent opacity-0"
                            whileHover={{ opacity: 0.9 }}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setFilter("page", String(p))}
          />
        </>
      )}
    </div>
  );
}