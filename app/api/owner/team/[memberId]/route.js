// app/api/owner/team/[memberId]/route.js
import { requireSession } from "@/lib/auth";
import { one, transaction } from "@/lib/db";
import { errors, ok } from "@/lib/http";
import { logActivity, getUserName } from "@/lib/handlers";

export async function PATCH(request, ctx) {
  const { memberId } = await ctx.params;
  const { session, error } = await requireSession();
  if (error) return error;

  let updates;
  try {
    updates = await request.json();
  } catch {
    return errors.badRequest("Invalid JSON body.");
  }

  const target = await one(
    `SELECT m.id, m.role, m.status, m.workspace_id AS "workspaceId", m.user_id AS "userId"
       FROM memberships m WHERE id = $1`,
    [memberId]
  );
  if (!target) return errors.notFound("Member");

  const caller = await one(
    `SELECT id, role FROM memberships
      WHERE workspace_id = $1 AND user_id = $2 AND status = 'active'`,
    [target.workspaceId, session.userId]
  );
  if (!caller || caller.role !== "owner") return errors.forbidden();
  if (target.role === "owner") return errors.forbidden();
  if (target.userId === session.userId) return errors.forbidden();

  if (updates.role !== undefined) {
    if (updates.role !== "admin")
      return errors.badRequest("Use the transfer flow for owner changes.");
    if (target.role !== "member")
      return errors.badRequest("Only members can be promoted to admin.");

    const result = await transaction(async (client) => {
      const targetName = await getUserName(target.userId, client);
      const adminRow = await client.query(
        `SELECT id, user_id AS "userId" FROM memberships
          WHERE workspace_id = $1 AND role = 'admin' AND status = 'active'
          LIMIT 1 FOR UPDATE`,
        [target.workspaceId]
      );
      const currentAdmin = adminRow.rows[0];

      await client.query(`UPDATE memberships SET role = 'admin' WHERE id = $1`, [target.id]);
      if (currentAdmin) {
        await client.query(`UPDATE memberships SET role = 'member' WHERE id = $1`, [currentAdmin.id]);
      }

      await logActivity({
        client,
        workspaceId: target.workspaceId,
        actorId: session.userId,
        type: "role_swapped",
        detail: `${targetName} to Admin`,
        from: "member",
        to: "admin",
      });

      return { promotedId: target.id, demotedId: currentAdmin?.id || null };
    });

    return ok({ ok: true, ...result });
  }

  const nextStatus = updates.status ?? target.status;
  if (!["active", "inactive"].includes(nextStatus))
    return errors.badRequest("Invalid status.");

  const updated = await transaction(async (client) => {
    const targetName = await getUserName(target.userId, client);
    const res = await client.query(
      `UPDATE memberships SET status = $2 WHERE id = $1
       RETURNING id, role, status`,
      [memberId, nextStatus]
    );
    if (nextStatus !== target.status) {
      await logActivity({
        client,
        workspaceId: target.workspaceId,
        actorId: session.userId,
        type: "member_status_changed",
        detail: `${targetName} to ${nextStatus}`,
        from: target.status,
        to: nextStatus,
      });
    }
    return res.rows[0];
  });

  return ok({ member: updated });
}

export async function DELETE(request, ctx) {
  const { memberId } = await ctx.params;
  const { session, error } = await requireSession();
  if (error) return error;

  const target = await one(
    `SELECT m.id, m.role, m.workspace_id AS "workspaceId", m.user_id AS "userId"
       FROM memberships m WHERE id = $1`,
    [memberId]
  );
  if (!target) return errors.notFound("Member");
  if (target.role === "owner") return errors.forbidden();

  const caller = await one(
    `SELECT id, role FROM memberships
      WHERE workspace_id = $1 AND user_id = $2 AND status = 'active'`,
    [target.workspaceId, session.userId]
  );
  if (!caller || caller.role !== "owner") return errors.forbidden();

  await transaction(async (client) => {
    const targetName = await getUserName(target.userId, client);
    await client.query(`DELETE FROM memberships WHERE id = $1`, [memberId]);
    await logActivity({
      client,
      workspaceId: target.workspaceId,
      actorId: session.userId,
      type: "member_removed",
      detail: `${targetName}`,
    });
  });

  return ok({ ok: true });
}