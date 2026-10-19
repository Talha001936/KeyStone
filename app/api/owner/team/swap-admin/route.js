// app/api/owner/team/swap-admin/route.js
import { requireSession, requireRole, resolveWorkspaceId } from "@/lib/auth";
import { one, transaction } from "@/lib/db";
import { errors, ok } from "@/lib/http";
import { logActivity, getUserName } from "@/lib/handlers";

const ROLE = "owner";

export async function POST(request) {
  const { session, error } = await requireSession();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return errors.badRequest("Invalid JSON body.");
  }

  const { memberId, workspaceId: inputWs } = body || {};
  if (!memberId) return errors.badRequest("memberId is required.");

  let workspaceId;
  try {
    workspaceId = await resolveWorkspaceId(session.userId, inputWs);
  } catch (e) {
    return e.__http || errors.forbidden();
  }
  if (!workspaceId) return errors.badRequest("No workspace.");

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const result = await transaction(async (client) => {
    const target = await client.query(
      `SELECT id, user_id AS "userId", role, status
         FROM memberships
        WHERE id = $1 AND workspace_id = $2 FOR UPDATE`,
      [memberId, workspaceId]
    );
    const t = target.rows[0];
    if (!t) throw Object.assign(new Error("missing"), { __code: "NOT_FOUND" });
    if (t.role === "owner") throw Object.assign(new Error("owner"), { __code: "OWNER" });
    if (t.role === "admin") throw Object.assign(new Error("already"), { __code: "ALREADY_ADMIN" });
    if (t.status !== "active") throw Object.assign(new Error("inactive"), { __code: "INACTIVE" });

    const currentAdmin = await client.query(
      `SELECT id FROM memberships
        WHERE workspace_id = $1 AND role = 'admin' AND status = 'active'
        LIMIT 1 FOR UPDATE`,
      [workspaceId]
    );
    const oldAdminId = currentAdmin.rows[0]?.id || null;
    const targetName = await getUserName(t.userId, client);

    await client.query(`UPDATE memberships SET role = 'admin' WHERE id = $1`, [t.id]);
    if (oldAdminId) {
      await client.query(`UPDATE memberships SET role = 'member' WHERE id = $1`, [oldAdminId]);
    }

    await logActivity({
      client,
      workspaceId,
      actorId: session.userId,
      type: "role_swapped",
      detail: `${targetName} to Admin`,
      from: "member",
      to: "admin",
    });

    return { newAdminId: t.id, oldAdminId };
  }).catch((e) => {
    if (e.__code === "NOT_FOUND") return { __err: errors.notFound("Member") };
    if (e.__code === "OWNER") return { __err: errors.forbidden() };
    if (e.__code === "ALREADY_ADMIN") return { __err: errors.badRequest("That member is already the admin.") };
    if (e.__code === "INACTIVE") return { __err: errors.badRequest("That member is inactive.") };
    throw e;
  });

  if (result.__err) return result.__err;
  return ok({ ok: true, ...result });
}