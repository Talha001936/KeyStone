// lib/auth.js
import { one } from "./db";
import { getSession } from "./session";
import { errors } from "./http";


export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return { session: null, error: errors.unauthorized() };
  }
  return { session, error: null };
}


export async function getMembership(userId, workspaceId) {
  if (!workspaceId) return null;
  return one(
    `SELECT id, workspace_id AS "workspaceId", user_id AS "userId",
            role, status, joined_at AS "joinedAt"
       FROM memberships
      WHERE user_id = $1 AND workspace_id = $2 AND status = 'active'`,
    [userId, workspaceId]
  );
}


export async function resolveWorkspaceId(userId, workspaceId) {
  if (workspaceId) {
    const m = await getMembership(userId, workspaceId);
    if (!m) {
      const err = new Error("forbidden");
      err.__http = errors.forbidden();
      throw err;
    }
    return workspaceId;
  }
  const row = await one(
    `SELECT workspace_id AS "workspaceId"
       FROM memberships
      WHERE user_id = $1 AND status = 'active'
      ORDER BY joined_at ASC
      LIMIT 1`,
    [userId]
  );
  return row?.workspaceId || null;
}

export async function requireRole(userId, workspaceId, allowedRoles) {
  const membership = await getMembership(userId, workspaceId);
  if (!membership) return { membership: null, error: "no-membership" };
  if (!allowedRoles.includes(membership.role)) {
    return { membership: null, error: "forbidden" };
  }
  return { membership, error: null };
}


export function roleFailureResponse(result) {
  if (result.error === "no-membership") return errors.forbidden();
  if (result.error === "forbidden") return errors.forbidden();
  return null;
}

export function forbidden() {
  return errors.forbidden();
}