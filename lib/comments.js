// lib/comments.js
import { one, many, transaction } from "./db";
import { errors, ok, parsePagination } from "./http";
import { initialsFrom, logActivity } from "./handlers";
import { validateComment } from "./validation";

export async function listComments({ task, searchParams }) {
  const { page, pageSize, offset } = parsePagination(searchParams, { defaultSize: 50, maxSize: 100 });

  const totalRow = await one(
    `SELECT COUNT(*)::int AS c FROM task_comments WHERE task_id = $1`,
    [task.id]
  );

  const rows = await many(
    `SELECT c.id, c.body, c.author_id AS "authorId", c.created_at AS "createdAt",
            u.name  AS "authorName", u.email AS "authorEmail"
       FROM task_comments c
       JOIN users u ON u.id = c.author_id
      WHERE c.task_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3`,
    [task.id, pageSize, offset]
  );

  const comments = rows.map((c) => ({
    id: c.id, body: c.body, authorId: c.authorId, authorName: c.authorName,
    authorEmail: c.authorEmail, authorInitials: initialsFrom(c.authorName), createdAt: c.createdAt,
  }));

  return { comments, total: totalRow?.c || 0, page, pageSize };
}

export async function createComment({ session, task, text }) {
  const v = validateComment({ body: text });
  if (!v.ok) return { error: errors.badRequest(v.message) };
  const body = v.value.body;

  const comment = await transaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO task_comments (workspace_id, task_id, author_id, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, body, author_id AS "authorId", created_at AS "createdAt"`,
      [task.workspaceId, task.id, session.userId, body]
    );

    const c = ins.rows[0];
    const author = await client.query(`SELECT name FROM users WHERE id = $1`, [session.userId]);
    c.authorName = author.rows[0]?.name || "Unknown";
    c.authorInitials = initialsFrom(c.authorName);

    await logActivity({
      client, workspaceId: task.workspaceId, taskId: task.id, actorId: session.userId,
      type: "comment_added",
      detail: `#${task.display_number} ${task.title || ""}`.trim(),
    });

    return c;
  });

  return { comment };
}