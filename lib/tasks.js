// lib/tasks.js
import { one, many, transaction } from "./db";
import { errors, ok, parsePagination } from "./http";
import {
  capitalize,
  initialsFrom,
  logActivity,
  ACTIVITY_TYPES,
  getUserName,
} from "./handlers";
import { PRIORITY, TASK_STATUS } from "./constants";
import { validateTask } from "./validation";

const TASK_STATUS_SET = new Set(Object.values(TASK_STATUS));
const PRIORITY_SET = new Set(Object.values(PRIORITY));

const SORTABLE = {
  created: "t.display_number",
  due: "t.due_date",
  priority: `CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
  status: `CASE t.status WHEN 'todo' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END`,
  title: "LOWER(t.title)",
};

export async function listTasks({ session, workspaceId, searchParams, role }) {
  const { page, pageSize, offset } = parsePagination(searchParams);
  const where = ["t.workspace_id = $1"];
  const values = [workspaceId];

  if (role === "member") {
    values.push(session.userId);
    where.push(`t.assignee_id = $${values.length}`);
  }

  const projectId = searchParams.get("projectId");
  if (projectId) {
    values.push(projectId);
    where.push(`t.project_id = $${values.length}`);
  }

  const status = searchParams.get("status");
  if (status) {
    const list = String(status).split(",").map((s) => s.toLowerCase().trim()).filter((s) => TASK_STATUS_SET.has(s));
    if (list.length) {
      values.push(list);
      where.push(`t.status = ANY($${values.length})`);
    }
  }

  const priority = searchParams.get("priority");
  if (priority) {
    const list = String(priority).split(",").map((s) => s.toLowerCase().trim()).filter((s) => PRIORITY_SET.has(s));
    if (list.length) {
      values.push(list);
      where.push(`t.priority = ANY($${values.length})`);
    }
  }

  const assigneeId = searchParams.get("assigneeId");
  if (assigneeId && role !== "member") {
    values.push(assigneeId);
    where.push(`t.assignee_id = $${values.length}`);
  }

  const q = searchParams.get("q");
  if (q && q.trim()) {
    values.push(`%${q.trim().toLowerCase()}%`);
    where.push(`(LOWER(t.title) LIKE $${values.length} OR LOWER(t.code) LIKE $${values.length})`);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;

  const totalRow = await one(`SELECT COUNT(*)::int AS c FROM tasks t ${whereSql}`, values);

  const sortKey = SORTABLE[searchParams.get("sort")] || SORTABLE.created;
  const order = searchParams.get("order") === "asc" ? "ASC" : "DESC";
  const listValues = [...values, pageSize, offset];

  const rows = await many(
    `SELECT t.id, t.code, t.display_number AS "displayNumber",
            t.title, t.description, t.status, t.priority,
            t.due_date AS "dueDate", t.comments, t.version,
            t.project_id AS "projectId",
            t.assignee_id AS "assigneeId",
            p.name AS "projectName",
            p.slug AS "projectSlug",
            u.name AS "assigneeName"
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u    ON u.id = t.assignee_id
       ${whereSql}
      ORDER BY ${sortKey} ${order} NULLS LAST, t.id
      LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
    listValues
  );

  const tasks = rows.map((t) => ({
    id: t.id, code: t.code, displayNumber: t.displayNumber,
    title: t.title, description: t.description, status: t.status,
    statusLabel: capitalize(t.status), priority: t.priority,
    priorityLabel: capitalize(t.priority), projectId: t.projectId,
    project: t.projectName || "—", projectSlug: t.projectSlug,
    assigneeId: t.assigneeId, assignee: t.assigneeName || "Unassigned",
    assigneeInitials: initialsFrom(t.assigneeName),
    due: t.dueDate || "—", dueDate: t.dueDate, comments: t.comments, version: t.version,
  }));

  return { tasks, total: totalRow?.c || 0, page, pageSize };
}

export async function createTask({ session, workspaceId, body }) {
  const v1 = validateTask(body, "create");
  if (!v1.ok) return { error: errors.badRequest(v1.message) };

  const project = await one(
    `SELECT id, due_date AS "dueDate" FROM projects WHERE id = $1 AND workspace_id = $2`,
    [v1.value.projectId, workspaceId]
  );
  if (!project) return { error: errors.badRequest("Invalid project.") };

  const v2 = validateTask(body, "create", { projectDueDate: project.dueDate });
  if (!v2.ok) return { error: errors.badRequest(v2.message) };
  const data = v2.value;

  if (data.assigneeId) {
    const m = await one(
      `SELECT 1 FROM memberships WHERE workspace_id = $1 AND user_id = $2 AND status = 'active'`,
      [workspaceId, data.assigneeId]
    );
    if (!m) return { error: errors.badRequest("Assignee must be a workspace member.") };
  }

  const task = await transaction(async (client) => {
    await client.query(`SELECT id FROM workspaces WHERE id = $1 FOR UPDATE`, [workspaceId]);

    const ins = await client.query(
      `INSERT INTO tasks
         (code, workspace_id, project_id, title, description, status,
          priority, assignee_id, created_by_id, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, code, display_number AS "displayNumber",
                 title, status, priority, project_id AS "projectId"`,
      [
        `TASK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`,
        workspaceId, data.projectId, data.title, data.description || "",
        data.status || "todo", data.priority || "medium",
        data.assigneeId || null, session.userId, data.dueDate || null,
      ]
    );
    const t = ins.rows[0];

    await logActivity({
      client, workspaceId, projectId: t.projectId, taskId: t.id, actorId: session.userId,
      type: ACTIVITY_TYPES.TASK_CREATED,
      detail: `#${t.displayNumber} ${data.title}`,
    });

    return t;
  });

  return { task };
}

export function taskResponse(task, role, membershipRole, userId) {
  return {
    task: {
      id: task.id, code: task.code, displayNumber: task.displayNumber,
      title: task.title, description: task.description, status: task.status,
      statusLabel: capitalize(task.status), priority: task.priority,
      priorityLabel: capitalize(task.priority), assigneeId: task.assignee_id,
      assigneeName: task.assigneeName, assigneeInitials: initialsFrom(task.assigneeName),
      creatorName: task.creatorName, projectId: task.projectId,
      projectSlug: task.projectSlug, projectName: task.projectName,
      projectDueDate: task.projectDueDate, dueDate: task.dueDate,
      version: task.version, comments: task.comments,
    },
    role: membershipRole,
    isAssignee: task.assignee_id === userId,
  };
}

const FIELD_MAP = {
  title: "title", description: "description", status: "status",
  priority: "priority", assigneeId: "assignee_id", dueDate: "due_date",
};

export async function updateTask({ session, task, updates, membershipRole }) {
  const isAssignee = task.assignee_id === session.userId;
  const isStatusUpdate = "status" in updates;

  if (isStatusUpdate && !isAssignee) return { error: errors.forbidden() };
  if (membershipRole === "member") {
    if (!isAssignee) return { error: errors.forbidden() };
    const allowed = ["status", "_version"];
    const bad = Object.keys(updates).filter((k) => !allowed.includes(k));
    if (bad.length) return { error: errors.forbidden() };
  }

  const project = await one(`SELECT due_date AS "dueDate" FROM projects WHERE id = $1`, [task.project_id]);
  const v = validateTask(updates, "update", { projectDueDate: project?.dueDate || null });
  if (!v.ok) return { error: errors.badRequest(v.message) };
  const data = v.value;

  if (data.assigneeId) {
    const m = await one(
      `SELECT 1 FROM memberships WHERE workspace_id = $1 AND user_id = $2 AND status = 'active'`,
      [task.workspace_id, data.assigneeId]
    );
    if (!m) return { error: errors.badRequest("Assignee must be a workspace member.") };
  }

  const sets = [];
  const values = [task.id];
  Object.entries(data).forEach(([key, value]) => {
    const col = FIELD_MAP[key];
    if (!col) return;
    values.push(value === "" ? null : value);
    sets.push(`${col} = $${values.length}`);
  });

  if (!sets.length) return { task };

  const expectedVersion = Number(updates._version ?? task.version);
  if (!Number.isFinite(expectedVersion)) return { error: errors.badRequest("Invalid _version.") };

  values.push(expectedVersion);
  const versionParam = values.length;
  sets.push(`version = version + 1`);

  const updated = await transaction(async (client) => {
    const res = await client.query(
      `UPDATE tasks SET ${sets.join(", ")}
        WHERE id = $1 AND version = $${versionParam}
        RETURNING *, due_date AS "dueDate", display_number AS "displayNumber"`,
      values
    );

    if (res.rowCount === 0) {
      const err = new Error("conflict");
      err.__conflict = true;
      throw err;
    }

    const t = res.rows[0];

    for (const [key, value] of Object.entries(data)) {
      const col = FIELD_MAP[key];
      if (!col) continue;
      const before = task[col];
      const after = value === "" ? null : value;
      if (before === after) continue;

      let type = `${key}_changed`;
      if (key === "status") type = ACTIVITY_TYPES.STATUS_CHANGED;
      else if (key === "assigneeId") type = ACTIVITY_TYPES.ASSIGNEE_CHANGED;
      else if (key === "priority") type = ACTIVITY_TYPES.PRIORITY_CHANGED;
      
      let detail = `#${t.displayNumber} ${t.title}`;
      
      // Make the detail more informative for changes
      if (key === "status") detail = `#${t.displayNumber} to ${capitalize(after)}`;
      else if (key === "assigneeId") {
        const newName = await getUserName(after, client);
        detail = `#${t.displayNumber} to ${newName}`;
      }
      else if (key === "priority") detail = `#${t.displayNumber} to ${capitalize(after)}`;
      else if (key === "dueDate") detail = `#${t.displayNumber} to ${after || "none"}`;

      await logActivity({
        client, workspaceId: task.workspace_id, projectId: task.project_id, taskId: task.id, actorId: session.userId,
        type, detail, from: before == null ? null : String(before), to: after == null ? null : String(after),
      });
    }

    return t;
  }).catch((e) => {
    if (e.__conflict) return { __conflict: true };
    throw e;
  });

  if (updated.__conflict) {
    return { error: errors.conflict("This task has been modified by someone else. Please refresh.", "CONFLICT") };
  }

  return { task: updated };
}

export async function deleteTask({ session, task }) {
  await transaction(async (client) => {
    await client.query(
      `INSERT INTO activities (workspace_id, project_id, actor_id, type, detail)
       VALUES ($1, $2, $3, 'task_deleted', $4)`,
      [task.workspace_id, task.project_id, session.userId, `#${task.display_number} ${task.title}`]
    );
    await client.query(`DELETE FROM tasks WHERE id = $1`, [task.id]);
  });
}