// app/api/owner/projects/route.js
import { requireSession, requireRole, resolveWorkspaceId } from "@/lib/auth";
import { one, transaction } from "@/lib/db";
import { errors, ok, parsePagination } from "@/lib/http";
import { logActivity } from "@/lib/handlers";
import { validateProject } from "@/lib/validation";
import { slugify, uniqueProjectSlug } from "@/lib/slug";
import { listProjects } from "@/lib/projects";

const ROLE = "owner";

export async function GET(request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  let workspaceId;
  try {
    workspaceId = await resolveWorkspaceId(
      session.userId,
      searchParams.get("workspaceId")
    );
  } catch (e) {
    return e.__http || errors.forbidden();
  }
  if (!workspaceId) return ok({ projects: [], total: 0, page: 1, pageSize: 20 });

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const { page, pageSize, offset } = parsePagination(searchParams);
  const result = await listProjects({ workspaceId, page, pageSize, offset });

  return ok({ ...result, page, pageSize });
}

export async function POST(request) {
  const { session, error } = await requireSession();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return errors.badRequest("Invalid JSON body.");
  }

  const v = validateProject(body, "create");
  if (!v.ok) return errors.badRequest(v.message);
  const data = v.value;

  let workspaceId;
  try {
    workspaceId = await resolveWorkspaceId(session.userId, body.workspaceId);
  } catch (e) {
    return e.__http || errors.forbidden();
  }
  if (!workspaceId) return errors.badRequest("No workspace.");

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const project = await transaction(async (client) => {
    const baseSlug = slugify(data.name);
    const slug = await uniqueProjectSlug(client, workspaceId, baseSlug);

    const ins = await client.query(
      `INSERT INTO projects
         (workspace_id, slug, name, description, status, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, slug, name, description, status,
                 due_date AS "dueDate", created_at AS "createdAt"`,
      [
        workspaceId,
        slug,
        data.name,
        data.description || "",
        data.status || "active",
        data.dueDate || null,
        session.userId,
      ]
    );
    const p = ins.rows[0];
    await logActivity({
      client,
      workspaceId,
      projectId: p.id,
      actorId: session.userId,
      type: "project_created",
      detail: `created project ${p.name}`,
    });
    return p;
  });

  return ok({ project }, { status: 201 });
}