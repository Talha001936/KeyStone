// lib/projects.js
import { one, many } from "./db";
import { capitalize } from "./handlers";

export async function listProjects({
  workspaceId,
  page,
  pageSize,
  offset,
  role,
  memberId,
}) {
  const where = ["p.workspace_id = $1"];
  const values = [workspaceId];

  if (role === "member" && memberId) {
    values.push(memberId);
    const userParam = `$${values.length}`;
    where.push(
      `EXISTS (
         SELECT 1 FROM tasks t_mine
          WHERE t_mine.project_id = p.id
            AND t_mine.assignee_id = ${userParam}
       )`
    );
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;

  const totalRow = await one(
    `SELECT COUNT(*)::int AS c FROM projects p ${whereSql}`,
    values
  );

  const listValues = [...values, pageSize, offset];

  const rows = await many(
    `SELECT p.id, p.slug, p.name, p.description, p.status,
            p.due_date AS "dueDate",
            p.created_at AS "createdAt",
            COALESCE(t.task_count, 0)::int  AS "taskCount",
            COALESCE(t.done_count, 0)::int  AS "doneCount",
            COALESCE(m.member_count, 0)::int AS "memberCount",
            COALESCE(
              (SELECT json_agg(pm.user_id) FROM project_members pm WHERE pm.project_id = p.id),
              '[]'::json
            ) AS "projectMemberIds"
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
       ${whereSql}
      ORDER BY p.created_at DESC
      LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
    listValues
  );

  const projects = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    status: capitalize(p.status),
    progress: p.taskCount ? Math.round((p.doneCount / p.taskCount) * 100) : 0,
    tasks: p.taskCount,
    members: p.memberCount,
    projectMemberIds: p.projectMemberIds,
    due: p.dueDate || "—",
    dueDate: p.dueDate,
    createdAt: p.createdAt,
  }));

  return { projects, total: totalRow?.c || 0 };
}

export async function getProjectWithTasks({ project, userId, role }) {
  const isMember = role === "member";

  const tasks = await many(
    isMember
      ? `SELECT t.id, t.code, t.display_number AS "displayNumber",
                t.title, t.description, t.status, t.priority,
                t.due_date AS "dueDate", t.comments, t.version,
                t.assignee_id AS "assigneeId",
                u.name AS "assigneeName",
                (t.assignee_id = $2) AS "isMine"
           FROM tasks t
           LEFT JOIN users u ON u.id = t.assignee_id
          WHERE t.project_id = $1 AND t.assignee_id = $2
          ORDER BY t.display_number ASC`
      : `SELECT t.id, t.code, t.display_number AS "displayNumber",
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

  const members = await many(
    `SELECT user_id AS id FROM project_members WHERE project_id = $1`,
    [project.id]
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
  const progress = mapped.length ? Math.round((done / mapped.length) * 100) : 0;

  return {
    project: {
      ...project,
      statusLabel: capitalize(project.status),
      progress,
      tasks: mapped.length,
      projectMemberIds: members.map((m) => m.id),
    },
    tasks: mapped,
  };
}