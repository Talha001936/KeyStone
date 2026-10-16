// lib/constants.js
export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
};

export const ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

export const STATUS_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const ACTIVITY_TYPES = {
  TASK_CREATED: "task_created",
  STATUS_CHANGED: "status_changed",
  ASSIGNEE_CHANGED: "assignee_changed",
  PRIORITY_CHANGED: "priority_changed",
  COMMENT_ADDED: "comment_added",
  TASK_DELETED: "task_deleted",
  PROJECT_CREATED: "project_created",
  PROJECT_UPDATED: "project_updated",
  PROJECT_DELETED: "project_deleted",
};

export function statusLabel(v) {
  return STATUS_LABELS[v] || v;
}
export function priorityLabel(v) {
  return PRIORITY_LABELS[v] || v;
}

export const ROLE_NAV = {
  owner: [
    { label: "Dashboard", href: "/owner", icon: "LayoutDashboard" },
    { label: "Projects", href: "/owner/projects", icon: "FolderKanban" },
    { label: "Tasks", href: "/owner/tasks", icon: "ListChecks" },
    { label: "Team", href: "/owner/team", icon: "Users" },
    { label: "Activity", href: "/owner/activity", icon: "Activity" },
    { label: "Workspace", href: "/owner/workspace/settings", icon: "Settings" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
    { label: "Projects", href: "/admin/projects", icon: "FolderKanban" },
    { label: "Tasks", href: "/admin/tasks", icon: "ListChecks" },
    { label: "Team", href: "/admin/team", icon: "Users" },
    { label: "Activity", href: "/admin/activity", icon: "Activity" },
  ],
  member: [
    { label: "Dashboard", href: "/member", icon: "LayoutDashboard" },
    { label: "Projects", href: "/member/projects", icon: "FolderKanban" },
    { label: "My Tasks", href: "/member/tasks", icon: "CheckSquare" },
    { label: "Activity", href: "/member/activity", icon: "Activity" },
    
    
  ],
};