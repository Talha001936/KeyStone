// app/api/owner/team/[memberId]/route.js
//
// Owner-managed membership actions.
//
// Roles are always CROSS-SWAPPED between the caller and the target:
//   - Caller is owner, target is admin → not allowed here; use /owner/transfer.
//   - Caller is owner, target is member → not allowed here; use /owner/transfer.
//
// Owner still has access to:
//   - Deactivate / activate members (status only)
//   - Remove members
//
// Role changes for owner → target go through /api/owner/transfer.

import { requireSession } from "@/lib/auth";
import { one, transaction } from "@/lib/db";
import { errors, ok } from "@/lib/http";
import { logActivity } from "@/lib/handlers";

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
    `SELECT m.id, m.role, m.status,
            m.workspace_id AS "workspaceId",
            m.user_id AS "userId"
       FROM memberships m
      WHERE m.id = $1`,
    [memberId]
  );
  if (!target) return errors.notFound("Member");

  // Caller must be an active owner or admin of the target's workspace.
  const caller = await one(
    `SELECT id, role, status
       FROM memberships
      WHERE workspace_id = $1 AND user_id = $2 AND status = 'active'`,
    [target.workspaceId, session.userId]
  );
  if (!caller) return errors.forbidden();
  if (caller.role !== "owner") return errors.forbidden();

  if (target.role === "owner") {
    return errors.forbidden();
  }
  if (target.userId === session.userId) {
    return errors.forbidden();
  }

  // Owner's only role-mutation path is /api/owner/transfer.
  if (updates.role !== undefined) {
    return errors.badRequest(
      "Use the transfer-ownership flow to change the owner role."
    );
  }

  // Status updates only.
  const nextStatus = updates.status ?? target.status;
  if (!["active", "inactive"].includes(nextStatus)) {
    return errors.badRequest("Invalid status.");
  }

  const updated = await transaction(async (client) => {
    const res = await client.query(
      `UPDATE memberships
          SET status = $2
        WHERE id = $1
        RETURNING id, role, status`,
      [memberId, nextStatus]
    );

    if (nextStatus !== target.status) {
      await logActivity({
        client,
        workspaceId: target.workspaceId,
        actorId: session.userId,
        type: "member_status_changed",
        detail: `changed status of member ${target.userId}`,
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
    `SELECT m.id, m.role, m.status,
            m.workspace_id AS "workspaceId",
            m.user_id AS "userId"
       FROM memberships m
      WHERE m.id = $1`,
    [memberId]
  );
  if (!target) return errors.notFound("Member");
  if (target.role === "owner") return errors.forbidden();

  const caller = await one(
    `SELECT id, role
       FROM memberships
      WHERE workspace_id = $1 AND user_id = $2 AND status = 'active'`,
    [target.workspaceId, session.userId]
  );
  if (!caller) return errors.forbidden();
  if (caller.role !== "owner") return errors.forbidden();

  await transaction(async (client) => {
    await client.query(`DELETE FROM memberships WHERE id = $1`, [memberId]);
    await logActivity({
      client,
      workspaceId: target.workspaceId,
      actorId: session.userId,
      type: "member_removed",
      detail: `removed member ${target.userId}`,
    });
  });

  return ok({ ok: true });
}