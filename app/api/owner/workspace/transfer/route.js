// app/api/owner/workspace/transfer/route.js
//
// Owner transfers ownership to another active member of the workspace.
// Roles are SWAPPED:
//   - Target becomes 'owner'
//   - Caller becomes the target's previous role ('admin' or 'member')
//
// Exactly one user holds 'owner' before and after. No other workspace
// is affected because every query is scoped by workspace_id.

import { requireSession } from "@/lib/auth";
import { errors, ok } from "@/lib/http";
import { transaction } from "@/lib/db";
import { logActivity } from "@/lib/handlers";

export async function POST(request) {
  const { session, error } = await requireSession();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return errors.badRequest("Invalid JSON body.");
  }

  const { workspaceId, toUserId } = body || {};
  if (!workspaceId || !toUserId) {
    return errors.badRequest("workspaceId and toUserId are required.");
  }
  if (toUserId === session.userId) {
    return errors.badRequest("You already own this workspace.");
  }

  try {
    const result = await transaction(async (client) => {
      // Lock both memberships so concurrent transfers can't race.
      const lock = await client.query(
        `SELECT m.id, m.user_id AS "userId", m.role, m.status
           FROM memberships m
          WHERE m.workspace_id = $1
            AND m.user_id = ANY($2::uuid[])
          FOR UPDATE`,
        [workspaceId, [session.userId, toUserId]]
      );

      const caller = lock.rows.find((r) => r.userId === session.userId);
      const target = lock.rows.find((r) => r.userId === toUserId);

      if (!caller || caller.status !== "active") {
        throw Object.assign(new Error("not-member"), { __code: "NOT_MEMBER" });
      }
      if (caller.role !== "owner") {
        throw Object.assign(new Error("not-owner"), { __code: "NOT_OWNER" });
      }
      if (!target || target.status !== "active") {
        throw Object.assign(new Error("bad-target"), {
          __code: "BAD_TARGET",
        });
      }
      if (target.role === "owner") {
        throw Object.assign(new Error("already-owner"), {
          __code: "ALREADY_OWNER",
        });
      }

      const previousTargetRole = target.role; // 'admin' | 'member'

      // ---- SWAP ----
      // 1. Target becomes owner.
      await client.query(
        `UPDATE memberships SET role = 'owner' WHERE id = $1`,
        [target.id]
      );

      // 2. Caller steps into the target's previous role.
      await client.query(
        `UPDATE memberships SET role = $2 WHERE id = $1`,
        [caller.id, previousTargetRole]
      );

      // 3. Sync workspace.owner_id.
      await client.query(
        `UPDATE workspaces SET owner_id = $1 WHERE id = $2`,
        [toUserId, workspaceId]
      );

      // 4. Log.
      await logActivity({
        client,
        workspaceId,
        actorId: session.userId,
        type: "ownership_transferred",
        detail: `transferred ownership to ${toUserId}`,
        from: "owner",
        to: previousTargetRole,
      });

      return { previousTargetRole };
    });

    return ok({ ok: true, newRole: result.previousTargetRole });
  } catch (err) {
    if (err.__code === "NOT_MEMBER") return errors.forbidden();
    if (err.__code === "NOT_OWNER") return errors.forbidden();
    if (err.__code === "BAD_TARGET") {
      return errors.badRequest(
        "Target must be an active member of this workspace."
      );
    }
    if (err.__code === "ALREADY_OWNER") {
      return errors.badRequest("Target is already the owner.");
    }
    console.error("[/api/owner/workspace/transfer]", err);
    return errors.server("Failed to transfer ownership.");
  }
}