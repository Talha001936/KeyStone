// app/api/owner/workspace/route.js
import { requireSession } from "@/lib/auth";
import { one, many, transaction } from "@/lib/db";
import { errors, ok } from "@/lib/http";
import { logActivity } from "@/lib/handlers";

const ROLE = "owner";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const workspaces = await many(
    `SELECT w.id, w.name, w.slug, w.owner_id AS "ownerId", m.role
       FROM memberships m
       JOIN workspaces w ON w.id = m.workspace_id
      WHERE m.user_id = $1 AND m.status = 'active'
      ORDER BY m.joined_at ASC`,
    [session.userId]
  );

  return ok({ workspaces });
}

export async function POST(request) {
  if (ROLE !== "owner") return errors.forbidden();

  const { session, error } = await requireSession();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return errors.badRequest("Invalid JSON body.");
  }

  const name = (body?.name || "").trim();
  if (!name) return errors.badRequest("Workspace name is required.");
  if (name.length < 2 || name.length > 60) {
    return errors.badRequest(
      "Workspace name must be between 2 and 60 characters."
    );
  }

  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "workspace";
  const suffix = Math.random().toString(36).slice(2, 6);
  let slug = `${base}-${suffix}`;

  const slugExists = await one(
    `SELECT 1 FROM workspaces WHERE slug = $1`,
    [slug]
  );
  if (slugExists) {
    slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const result = await transaction(async (client) => {
    const wsRow = await client.query(
      `INSERT INTO workspaces (name, slug, owner_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, slug, owner_id AS "ownerId", created_at AS "createdAt"`,
      [name, slug, session.userId]
    );
    const workspace = wsRow.rows[0];

    await client.query(
      `INSERT INTO memberships (workspace_id, user_id, role, status)
       VALUES ($1, $2, 'owner', 'active')`,
      [workspace.id, session.userId]
    );

    await logActivity({
      client,
      workspaceId: workspace.id,
      actorId: session.userId,
      type: "workspace_created",
      detail: `created workspace ${workspace.name}`,
    });

    return workspace;
  });

  return ok({ workspace: result }, { status: 201 });
}