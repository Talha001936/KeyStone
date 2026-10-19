// app/api/owner/projects/[slug]/route.js
import { requireSession, requireRole } from "@/lib/auth";
import { one, transaction } from "@/lib/db";
import { errors, ok } from "@/lib/http";
import { logActivity } from "@/lib/handlers";
import { validateProject, validateProjectDelete } from "@/lib/validation";
import { findProjectBySlug } from "@/lib/slug-resolve";
import { getProjectWithTasks } from "@/lib/projects";

const ROLE = "admin";

export async function GET(request, ctx) {
  const { slug } = await ctx.params;
  const { session, error } = await requireSession();
  if (error) return error;

  const project = await findProjectBySlug(session.userId, slug);
  if (!project) return errors.notFound("Project");

  const roleRes = await requireRole(session.userId, project.workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const result = await getProjectWithTasks({
    project,
    userId: session.userId,
    role: ROLE,
  });

  return ok({ ...result, role: roleRes.membership.role });
}

export async function PATCH(request, ctx) {
  const { slug } = await ctx.params;
  const { session, error } = await requireSession();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return errors.badRequest("Invalid JSON body.");
  }

  const { projectMemberIds, ...projectData } = body;

  const v = validateProject(projectData, "update");
  if (!v.ok) return errors.badRequest(v.message);
  const data = v.value;

  const project = await findProjectBySlug(session.userId, slug);
  if (!project) return errors.notFound("Project");

  const roleRes = await requireRole(session.userId, project.workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const updated = await transaction(async (client) => {
    const res = await client.query(
      `UPDATE projects
          SET name        = COALESCE($2, name),
              description = COALESCE($3, description),
              status      = COALESCE($4, status),
              due_date    = COALESCE($5, due_date)
        WHERE id = $1
        RETURNING id, slug, name, description, status,
                  due_date AS "dueDate"`,
      [
        project.id,
        data.name ?? null,
        data.description ?? null,
        data.status ?? null,
        data.dueDate ?? null,
      ]
    );
    const p = res.rows[0];

    if (Array.isArray(projectMemberIds)) {
      await client.query(`DELETE FROM project_members WHERE project_id = $1`, [project.id]);
      for (const uId of projectMemberIds) {
        await client.query(
          `INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [project.id, uId]
        );
      }
    }

    await logActivity({
      client,
      workspaceId: project.workspaceId,
      projectId: project.id,
      actorId: session.userId,
      type: "project_updated",
      detail: `${p.name}`,
    });
    return p;
  });

  return ok({ project: updated });
}

export async function DELETE(request, ctx) {
  const { slug } = await ctx.params;
  const { session, error } = await requireSession();
  if (error) return error;

  const project = await findProjectBySlug(session.userId, slug);
  if (!project) return errors.notFound("Project");

  const roleRes = await requireRole(session.userId, project.workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();
  if (roleRes.membership.role !== "owner") return errors.forbidden();

  const taskCountRow = await one(
    `SELECT COUNT(*)::int AS c FROM tasks WHERE project_id = $1`,
    [project.id]
  );
  const del = validateProjectDelete({ taskCount: taskCountRow?.c || 0 });
  if (!del.ok) return errors.badRequest(del.message);

  await transaction(async (client) => {
    await logActivity({
      client,
      workspaceId: project.workspaceId,
      actorId: session.userId,
      type: "project_deleted",
      detail: `${project.name}`,
    });
    await client.query(`DELETE FROM projects WHERE id = $1`, [project.id]);
  });

  return ok({ ok: true });
}