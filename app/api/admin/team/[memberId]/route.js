// app/api/admin/team/[memberId]/route.js
//
// Admin-managed membership actions.
//
// Admin can PROMOTE a member to admin via cross-swap:
//   - Target becomes 'admin'
//   - Caller (the current admin) becomes 'member'
//
// Admin cannot:
//   - Promote anyone to 'owner'
//   - Demote the owner
//   - Modify themselves
//
// The old admin can always be re-promoted later if the workspace
// wants to swap back.

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

  // Caller must be an active admin of the target's workspace.
  const caller = await one(
    `SELECT id, role, status
       FROM memberships
      WHERE workspace_id = $1 AND user_id = $2 AND status = 'active'`,
    [target.workspaceId, session.userId]
  );
  if (!caller) return errors.forbidden();
  if (caller.role !== "admin") return errors.forbidden();

  if (target.role === "owner") return errors.forbidden();
  if (target.userId === session.userId) return errors.forbidden();

  // Role updates: only member → admin cross-swap is allowed.
  if (updates.role !== undefined) {
    if (updates.role !== "admin") {
      return errors.badRequest("Admins can only promote members to admin.");
    }
    if (target.role !== "member") {
      return errors.badRequest("Only members can be promoted to admin.");
    }

    const result = await transaction(async (client) => {
      // Lock both rows.
      const lock = await client.query(
        `SELECT id, role FROM memberships
          WHERE id = ANY($1::uuid[]) FOR UPDATE`,
        [[caller.id, target.id]]
      );
      const lockedCaller = lock.rows.find((r) => r.id === caller.id);
      const lockedTarget = lock.rows.find((r) => r.id === target.id);

      if (!lockedCaller || lockedCaller.role !== "admin") {
        throw Object.assign(new Error("stale"), { __code: "STALE" });
      }
      if (!lockedTarget || lockedTarget.role !== "member") {
        throw Object.assign(new Error("stale"), { __code: "STALE" });
      }

      // ---- CROSS-SWAP ----
      await client.query(
        `UPDATE memberships SET role = 'admin' WHERE id = $1`,
        [target.id]
      );
      await client.query(
        `UPDATE memberships SET role = 'member' WHERE id = $1`,
        [caller.id]
      );

      await logActivity({
        client,
        workspaceId: target.workspaceId,
        actorId: session.userId,
        type: "role_swapped",
        detail: `promoted ${target.userId} to admin (self demoted to member)`,
        from: "member",
        to: "admin",
      });

      return { promotedId: target.id, demotedId: caller.id };
    }).catch((e) => {
      if (e.__code === "STALE") return { __stale: true };
      throw e;
    });

    if (result.__stale) {
      return errors.conflict(
        "Someone else changed roles in this workspace. Please refresh."
      );
    }

    return ok({ ok: true, ...result });
  }

  // Otherwise, status updates only.
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
  if (caller.role !== "admin") return errors.forbidden();

  if (target.userId === session.userId) return errors.forbidden();
  if (target.role === "admin") return errors.forbidden();

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