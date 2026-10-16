// app/api/member/tasks/[taskId]/route.js
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

const ROLE = "member";

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

  // Members may only update status, and only on their own tasks.
  if (task.assignee_id !== session.userId) return errors.forbidden();
  const allowed = ["status"];
  const bad = Object.keys(updates).filter((k) => !allowed.includes(k));
  if (bad.length) return errors.forbidden();

  // Members do not set due dates, so no project-bound check needed.
  const v = validateTask(updates, "update");
  if (!v.ok) return errors.badRequest(v.message);
  const data = v.value;

  const sets = [];
  const values = [taskId];
  Object.entries(data).forEach(([key, value]) => {
    const col = { status: "status" }[key];
    if (!col) return;
    values.push(value);
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

    if (task.status !== data.status) {
      await logActivity({
        client,
        workspaceId: task.workspace_id,
        projectId: task.project_id,
        taskId: task.id,
        actorId: session.userId,
        type: ACTIVITY_TYPES.STATUS_CHANGED,
        detail: `changed status on #${t.displayNumber}`,
        from: task.status,
        to: data.status,
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

export async function DELETE() {
  return errors.forbidden();
}