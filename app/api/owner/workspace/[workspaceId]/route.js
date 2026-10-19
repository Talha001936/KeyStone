// app/api/owner/workspace/[workspaceId]/route.js
import { requireSession, requireRole } from "@/lib/auth";
import { one, transaction, query } from "@/lib/db";
import { errors, ok } from "@/lib/http";
import { validateWorkspace } from "@/lib/validation";
import { logActivity } from "@/lib/handlers";
import { slugify } from "@/lib/slug";

const ROLE = "owner";

export async function PATCH(request, ctx) {
  const { workspaceId } = await ctx.params;
  const { session, error } = await requireSession();
  if (error) return error;

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  let body;
  try {
    body = await request.json();
  } catch {
    return errors.badRequest("Invalid JSON body.");
  }

  const v = validateWorkspace(body, "update");
  if (!v.ok) return errors.badRequest(v.message);

  const newName = v.value.name;
  const baseSlug = slugify(newName, { maxLen: 60 });

  const result = await transaction(async (client) => {
    // Ensure the new slug is unique
    let slug = baseSlug;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const dup = await client.query(
        `SELECT 1 FROM workspaces WHERE slug = $1 AND id != $2`,
        [slug, workspaceId]
      );
      if (!dup.rows[0]) {
        isUnique = true;
      } else {
        slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
        attempts++;
      }
    }

    const ws = await client.query(
      `UPDATE workspaces SET name = $1, slug = $2 WHERE id = $3 
       RETURNING id, name, slug`,
      [newName, slug, workspaceId]
    );

    await logActivity({
      client,
      workspaceId,
      actorId: session.userId,
      type: "workspace_updated",
      detail: `updated workspace name to ${newName}`,
    });

    return ws.rows[0];
  });

  return ok({ workspace: result });
}

export async function DELETE(request, ctx) {
  const { workspaceId } = await ctx.params;
  const { session, error } = await requireSession();
  if (error) return error;

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const members = await one(
    `SELECT COUNT(*)::int AS c FROM memberships
      WHERE workspace_id = $1 AND status = 'active'`,
    [workspaceId]
  );
  const projects = await one(
    `SELECT COUNT(*)::int AS c FROM projects WHERE workspace_id = $1`,
    [workspaceId]
  );
  const tasks = await one(
    `SELECT COUNT(*) AS c FROM tasks WHERE workspace_id = $1`,
    [workspaceId]
  );

  const extraMembers = Math.max(0, (members?.c || 0) - 1);
  if (extraMembers > 0 || (projects?.c || 0) > 0 || (tasks?.c || 0) > 0) {
    return errors.badRequest(
      "This workspace still has members, projects, or tasks. Remove them before deleting the workspace."
    );
  }

  await query(`DELETE FROM workspaces WHERE id = $1`, [workspaceId]);
  return ok({ ok: true });
}