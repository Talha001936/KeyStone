// lib/activities.js
import { one, many } from "./db";
import { parsePagination } from "./http";
import { initialsFrom } from "./handlers";

export async function listActivities({ workspaceId, searchParams }) {
  const { page, pageSize, offset } = parsePagination(searchParams);

  const type = searchParams.get("type");
  const actorId = searchParams.get("actorId");
  const projectId = searchParams.get("projectId");

  const where = ["a.workspace_id = $1"];
  const values = [workspaceId];

  if (type) {
    values.push(type);
    where.push(`a.type = $${values.length}`);
  }
  if (actorId) {
    values.push(actorId);
    where.push(`a.actor_id = $${values.length}`);
  }
  if (projectId) {
    values.push(projectId);
    where.push(`a.project_id = $${values.length}`);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;

  const totalRow = await one(
    `SELECT COUNT(*)::int AS c FROM activities a ${whereSql}`,
    values
  );

  const listValues = [...values, pageSize, offset];
  const rows = await many(
    `SELECT a.id, a.type, a.detail,
            a.from_value AS "from", a.to_value AS "to",
            a.created_at AS "createdAt",
            u.name AS "actorName",
            p.name AS "projectName",
            t.code AS "taskCode"
       FROM activities a
       LEFT JOIN users u    ON u.id = a.actor_id
       LEFT JOIN projects p ON p.id = a.project_id
       LEFT JOIN tasks t    ON t.id = a.task_id
       ${whereSql}
      ORDER BY a.created_at DESC
      LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
    listValues
  );

  const activities = rows.map((a) => ({
    id: a.id,
    type: a.type,
    detail: a.detail,
    actorName: a.actorName || "Unknown",
    initials: initialsFrom(a.actorName),
    target: a.detail,
    resource: a.taskCode || "",
    project: a.projectName || "",
    time: a.createdAt,
    createdAt: a.createdAt,
    from: a.from,
    to: a.to,
  }));

  return { activities, total: totalRow?.c || 0, page, pageSize };
}

export async function activitiesSince(workspaceId, since) {
  return many(
    `SELECT a.id, a.type, a.detail,
            a.from_value AS "from", a.to_value AS "to",
            a.created_at AS "createdAt",
            u.name AS "actorName",
            p.name AS "projectName",
            t.code AS "taskCode"
       FROM activities a
       LEFT JOIN users u    ON u.id = a.actor_id
       LEFT JOIN projects p ON p.id = a.project_id
       LEFT JOIN tasks t    ON t.id = a.task_id
      WHERE a.workspace_id = $1 AND a.created_at > $2
      ORDER BY a.created_at ASC
      LIMIT 50`,
    [workspaceId, since]
  );
}

/* ============================================================
   SSE HANDLER — full stream builder, reused by every role
   ============================================================ */
export function buildActivitiesStream({ workspaceId, since, request }) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = (event, data) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      send("hello", { workspaceId, since: since.toISOString() });

      const interval = setInterval(async () => {
        if (closed) return;
        try {
          const rows = await activitiesSince(workspaceId, since);
          for (const a of rows) {
            send("activity", {
              id: a.id,
              type: a.type,
              detail: a.detail,
              actorName: a.actorName || "Unknown",
              resource: a.taskCode || "",
              project: a.projectName || "",
              from: a.from,
              to: a.to,
              createdAt: a.createdAt,
            });
            const t = new Date(a.createdAt);
            if (t > since) since = t;
          }
        } catch (err) {
          console.error("[SSE]", err);
        }
      }, 2000);

      const heartbeat = setInterval(() => {
        if (closed) return;
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {}
      };

      request.signal?.addEventListener("abort", cleanup);
    },
  });
}