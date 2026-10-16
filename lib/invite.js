// lib/invite.js
import { one } from "./db";
import { errors } from "./http";
import { generateToken } from "./tokens";

export const PICKER_ROLES = ["owner", "admin"];


export async function resolveInviteTarget({ userId, email: rawEmail }) {
  if (userId) {
    const user = await one(
      `SELECT id, name, email FROM users WHERE id = $1`,
      [userId]
    );
    if (!user) return { error: errors.badRequest("User not found.") };
    return { user };
  }
  if (rawEmail) {
    const email = String(rawEmail).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: errors.badRequest("Invalid email address.") };
    }
    const user = await one(
      `SELECT id, name, email FROM users WHERE LOWER(email) = $1`,
      [email]
    );
    if (!user) {
      return {
        error: errors.badRequest(
          "That email isn't registered. Only registered users can be invited."
        ),
      };
    }
    return { user };
  }
  return { error: errors.badRequest("userId or email is required.") };
}

export async function determineInviteRole(workspaceId) {
  const adminCount = await one(
    `SELECT COUNT(*)::int AS c
       FROM memberships
      WHERE workspace_id = $1 AND role = 'admin'`,
    [workspaceId]
  );
  return (adminCount?.c || 0) === 0 ? "admin" : "member";
}

export { generateToken };