// lib/projects.js
import { one, many } from "./db";
import { capitalize } from "./handlers";

export async function listProjects({ workspaceId, page, pageSize, offset }) {
  const totalRow = await one(
    `SELECT COUNT(*)::int AS c FROM projects WHERE workspace_id = $1`,
    [workspaceId]
  );

  const rows = await many(
    `SELECT p.id, p.slug, p.name, p.description, p.status,
            p.due_date AS "dueDate",
            p.created_at AS "createdAt",
            COALESCE(t.task_count, 0)::int  AS "taskCount",
            COALESCE(t.done_count, 0)::int  AS "doneCount",
            COALESCE(m.member_count, 0)::int AS "memberCount"
       FROM projects p
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS task_count,
                COUNT(*) FILTER (WHERE status = 'done') AS done_count
           FROM tasks
          WHERE project_id = p.id
       ) t ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS member_count
           FROM memberships
          WHERE workspace_id = p.workspace_id AND status = 'active'
       ) m ON TRUE
      WHERE p.workspace_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
    [workspaceId, pageSize, offset]
  );

  const projects = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    status: capitalize(p.status),
    progress: p.taskCount
      ? Math.round((p.doneCount / p.taskCount) * 100)
      : 0,
    tasks: p.taskCount,
    members: p.memberCount,
    due: p.dueDate || "—",
    dueDate: p.dueDate,
    createdAt: p.createdAt,
  }));

  return { projects, total: totalRow?.c || 0 };
}


export async function getProjectWithTasks({ project, userId }) {
  const tasks = await many(
    `SELECT t.id, t.code, t.display_number AS "displayNumber",
            t.title, t.description, t.status, t.priority,
            t.due_date AS "dueDate", t.comments, t.version,
            t.assignee_id AS "assigneeId",
            u.name AS "assigneeName",
            (t.assignee_id = $2) AS "isMine"
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
      WHERE t.project_id = $1
      ORDER BY t.display_number ASC`,
    [project.id, userId]
  );

  const mapped = tasks.map((t) => ({
    id: t.id,
    code: t.code,
    displayNumber: t.displayNumber,
    title: t.title,
    description: t.description,
    status: t.status,
    statusLabel: capitalize(t.status),
    priority: t.priority,
    priorityLabel: capitalize(t.priority),
    assigneeId: t.assigneeId,
    assignee: t.assigneeName || "Unassigned",
    assigneeInitials: (t.assigneeName || "?")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    due: t.dueDate || "—",
    dueDate: t.dueDate,
    comments: t.comments,
    version: t.version,
    isMine: t.isMine,
  }));

  const done = mapped.filter((t) => t.status === "done").length;
  const progress = mapped.length
    ? Math.round((done / mapped.length) * 100)
    : 0;

  return {
    project: {
      ...project,
      statusLabel: capitalize(project.status),
      progress,
      tasks: mapped.length,
    },
    tasks: mapped,
  };
}