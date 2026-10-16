// app/api/owner/tasks/[taskId]/route.js
import { requireSession, requireRole } from "@/lib/auth";
import { one, transaction } from "@/lib/db";
import { errors, ok } from "@/lib/http";
import {
  capitalize,
  initialsFrom,
  logActivity,
  ACTIVITY_TYPES,
} from "@/lib/handlers";
import { validateTask } from "@/lib/validation";

const ROLE = "owner";
const DELETABLE_ROLES = new Set(["owner", "admin"]);

/* ---------------- GET ---------------- */

export async function GET(request, ctx) {
  const { taskId } = await ctx.params;

  const { session, error } = await requireSession();
  if (error) return error;

  const task = await one(
    `SELECT t.*, t.due_date AS "dueDate",
            t.display_number AS "displayNumber",
            t.project_id AS "projectId",
            u.name AS "assigneeName",
            c.name AS "creatorName",
            p.due_date AS "projectDueDate"
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
       LEFT JOIN users c ON c.id = t.created_by_id
       LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.id = $1`,
    [taskId]
  );
  if (!task) return errors.notFound("Task");

  const roleRes = await requireRole(session.userId, task.workspace_id, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  return ok({
    task: {
      id: task.id,
      code: task.code,
      displayNumber: task.displayNumber,
      title: task.title,
      description: task.description,
      status: task.status,
      statusLabel: capitalize(task.status),
      priority: task.priority,
      priorityLabel: capitalize(task.priority),
      assigneeId: task.assignee_id,
      assigneeName: task.assigneeName,
      assigneeInitials: initialsFrom(task.assigneeName),
      creatorName: task.creatorName,
      projectId: task.projectId,
      projectDueDate: task.projectDueDate,
      dueDate: task.dueDate,
      version: task.version,
      comments: task.comments,
    },
    role: roleRes.membership.role,
    isAssignee: task.assignee_id === session.userId,
  });
}

/* ---------------- PATCH ---------------- */

export async function PATCH(request, ctx) {
  const { taskId } = await ctx.params;

  const { session, error } = await requireSession();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return errors.badRequest("Invalid JSON body.");
  }

  const { _version, ...updates } = body;

  const task = await one(`SELECT * FROM tasks WHERE id = $1`, [taskId]);
  if (!task) return errors.notFound("Task");

  const roleRes = await requireRole(session.userId, task.workspace_id, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const membershipRole = roleRes.membership.role;
  const isAssignee = task.assignee_id === session.userId;

  /* ---------- Field-level authorization ----------
     - Status can ONLY be changed by the current assignee.
     - Members can only change status (and only on their own tasks).
     - Owner / Admin can change everything except status.
  */
  const isStatusUpdate = "status" in updates;

  if (isStatusUpdate && !isAssignee) {
    return errors.forbidden();
  }

  if (membershipRole === "member") {
    if (!isAssignee) return errors.forbidden();
    const allowed = ["status"];
    const bad = Object.keys(updates).filter((k) => !allowed.includes(k));
    if (bad.length) return errors.forbidden();
  }

  /* ---------- Project due date for validation ---------- */
  const project = await one(
    `SELECT due_date AS "dueDate" FROM projects WHERE id = $1`,
    [task.project_id]
  );

  /* ---------- Shared validation ---------- */
  const v = validateTask(updates, "update", {
    projectDueDate: project?.dueDate || null,
  });
  if (!v.ok) return errors.badRequest(v.message);
  const data = v.value;

  /* ---------- Assignee must be an active member ---------- */
  if (data.assigneeId) {
    const m = await one(
      `SELECT 1 FROM memberships
        WHERE workspace_id = $1 AND user_id = $2 AND status = 'active'`,
      [task.workspace_id, data.assigneeId]
    );
    if (!m) return errors.badRequest("Assignee must be a workspace member.");
  }

  /* ---------- Build SET clause ---------- */
  const fieldMap = {
    title: "title",
    description: "description",
    status: "status",
    priority: "priority",
    assigneeId: "assignee_id",
    dueDate: "due_date",
  };

  const sets = [];
  const values = [taskId];
  Object.entries(data).forEach(([key, value]) => {
    const col = fieldMap[key];
    if (!col) return;
    values.push(value === "" ? null : value);
    sets.push(`${col} = $${values.length}`);
  });

  if (!sets.length) return ok({ task });

  const expectedVersion =
    _version === undefined ? task.version : Number(_version);
  if (!Number.isFinite(expectedVersion)) {
    return errors.badRequest("Invalid _version.");
  }

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
      const col = fieldMap[key];
      if (!col) continue;
      const before = task[col];
      const after = value === "" ? null : value;
      if (before === after) continue;

      let type;
      if (key === "status") type = ACTIVITY_TYPES.STATUS_CHANGED;
      else if (key === "assigneeId") type = ACTIVITY_TYPES.ASSIGNEE_CHANGED;
      else if (key === "priority") type = ACTIVITY_TYPES.PRIORITY_CHANGED;
      else type = `${key}_changed`;

      await logActivity({
        client,
        workspaceId: task.workspace_id,
        projectId: task.project_id,
        taskId: task.id,
        actorId: session.userId,
        type,
        detail: `changed ${key} on #${t.displayNumber}`,
        from: before == null ? null : String(before),
        to: after == null ? null : String(after),
      });
    }

    return t;
  }).catch((e) => {
    if (e.__conflict) return { __conflict: true };
    throw e;
  });

  if (updated.__conflict) {
    return errors.conflict(
      "This task has been modified by someone else. Please refresh.",
      "CONFLICT"
    );
  }

  return ok({ task: updated });
}

/* ---------------- DELETE ---------------- */

export async function DELETE(request, ctx) {
  if (!DELETABLE_ROLES.has(ROLE)) return errors.forbidden();
  const { taskId } = await ctx.params;

  const { session, error } = await requireSession();
  if (error) return error;

  const task = await one(`SELECT * FROM tasks WHERE id = $1`, [taskId]);
  if (!task) return errors.notFound("Task");

  const roleRes = await requireRole(session.userId, task.workspace_id, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  await transaction(async (client) => {
    await client.query(
      `INSERT INTO activities
         (workspace_id, project_id, actor_id, type, detail)
       VALUES ($1, $2, $3, 'task_deleted', $4)`,
      [
        task.workspace_id,
        task.project_id,
        session.userId,
        `deleted task #${task.display_number}`,
      ]
    );
    await client.query(`DELETE FROM tasks WHERE id = $1`, [taskId]);
  });

  return ok({ ok: true });
}