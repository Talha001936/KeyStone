// lib/slug-resolve.js
import { one } from "./db";


export async function findProjectBySlug(userId, slug) {
  return one(
    `SELECT p.id, p.workspace_id AS "workspaceId", p.slug, p.name,
            p.description, p.status, p.due_date AS "dueDate",
            p.created_at AS "createdAt"
       FROM projects p
       JOIN memberships m
         ON m.workspace_id = p.workspace_id
        AND m.user_id = $1
        AND m.status = 'active'
      WHERE p.slug = $2
      LIMIT 1`,
    [userId, slug]
  );
}


export async function findTaskBySlugAndNumber(userId, slug, displayNumber) {
  const num = Number(displayNumber);
  if (!Number.isFinite(num)) return null;

  return one(
    `SELECT t.*,
            t.due_date AS "dueDate",
            t.display_number AS "displayNumber",
            t.project_id AS "projectId",
            p.slug AS "projectSlug",
            p.name AS "projectName",
            p.due_date AS "projectDueDate",
            p.workspace_id AS "workspaceId",
            u.name AS "assigneeName",
            c.name AS "creatorName"
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN memberships m
         ON m.workspace_id = p.workspace_id
        AND m.user_id = $1
        AND m.status = 'active'
       LEFT JOIN users u ON u.id = t.assignee_id
       LEFT JOIN users c ON c.id = t.created_by_id
      WHERE p.slug = $2 AND t.display_number = $3
      LIMIT 1`,
    [userId, slug, num]
  );
}