// lib/handlers.js
import { one, many, query, transaction } from "./db";
import { requireSession, requireRole, resolveWorkspaceId } from "./auth";
import { errors, ok } from "./http";
import { ACTIVITY_TYPES } from "./constants";


export function capitalize(s) {
  if (!s) return s;
  return s
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function initialsFrom(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function isValidDate(s) {
  if (s == null || s === "") return true;
  if (typeof s !== "string") return false;
  const t = Date.parse(s);
  return Number.isFinite(t);
}


export async function logActivity({
  workspaceId,
  projectId,
  taskId,
  actorId,
  type,
  detail,
  from,
  to,
  client,
}) {
  const runner = client ? client.query.bind(client) : query;
  await runner(
    `INSERT INTO activities
       (workspace_id, project_id, task_id, actor_id, type, detail, from_value, to_value)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      workspaceId,
      projectId || null,
      taskId || null,
      actorId,
      type,
      detail || "",
      from ?? null,
      to ?? null,
    ]
  );
}

export { ACTIVITY_TYPES };