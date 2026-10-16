// app/api/member/tasks/[taskId]/comments/route.js
import { requireSession, requireRole } from "@/lib/auth";
import { one, many, transaction } from "@/lib/db";
import { errors, ok, parsePagination } from "@/lib/http";
import { initialsFrom, logActivity } from "@/lib/handlers";
import { validateComment } from "@/lib/validation";

const ROLE = "member";

async function loadTask(taskId) {
  return one(
    `SELECT id, code, workspace_id AS "workspaceId",
            assignee_id AS "assigneeId"
       FROM tasks WHERE id = $1`,
    [taskId]
  );
}

export async function GET(request, ctx) {
  const { taskId } = await ctx.params;

  const { session, error } = await requireSession();
  if (error) return error;

  const task = await loadTask(taskId);
  if (!task) return errors.notFound("Task");

  const roleRes = await requireRole(session.userId, task.workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const { searchParams } = new URL(request.url);
  const { page, pageSize, offset } = parsePagination(searchParams, {
    defaultSize: 50,
    maxSize: 100,
  });

  const totalRow = await one(
    `SELECT COUNT(*)::int AS c FROM task_comments WHERE task_id = $1`,
    [taskId]
  );

  const rows = await many(
    `SELECT c.id, c.body,
            c.author_id AS "authorId",
            c.created_at AS "createdAt",
            u.name  AS "authorName",
            u.email AS "authorEmail"
       FROM task_comments c
       JOIN users u ON u.id = c.author_id
      WHERE c.task_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3`,
    [taskId, pageSize, offset]
  );

  const comments = rows.map((c) => ({
    id: c.id,
    body: c.body,
    authorId: c.authorId,
    authorName: c.authorName,
    authorEmail: c.authorEmail,
    authorInitials: initialsFrom(c.authorName),
    createdAt: c.createdAt,
  }));

  return ok({ comments, total: totalRow?.c || 0, page, pageSize });
}

export async function POST(request, ctx) {
  const { taskId } = await ctx.params;

  const { session, error } = await requireSession();
  if (error) return error;

  const task = await loadTask(taskId);
  if (!task) return errors.notFound("Task");

  const roleRes = await requireRole(session.userId, task.workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  // Members can only comment on tasks assigned to them.
  if (task.assigneeId !== session.userId) return errors.forbidden();

  let body;
  try {
    body = await request.json();
  } catch {
    return errors.badRequest("Invalid JSON body.");
  }

  const v = validateComment(body);
  if (!v.ok) return errors.badRequest(v.message);
  const { body: text } = v.value;

  const comment = await transaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO task_comments (workspace_id, task_id, author_id, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, body, author_id AS "authorId", created_at AS "createdAt"`,
      [task.workspaceId, taskId, session.userId, text]
    );

    const c = ins.rows[0];

    const author = await client.query(
      `SELECT name FROM users WHERE id = $1`,
      [session.userId]
    );
    c.authorName = author.rows[0]?.name || "Unknown";
    c.authorInitials = initialsFrom(c.authorName);

    await logActivity({
      client,
      workspaceId: task.workspaceId,
      taskId,
      actorId: session.userId,
      type: "comment_added",
      detail: `commented on #${task.code}`,
    });

    return c;
  });

  return ok({ comment }, { status: 201 });
}