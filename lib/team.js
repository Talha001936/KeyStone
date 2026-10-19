// lib/team.js
import { one, many, transaction } from "./db";
import { errors } from "./http";
import { capitalize, logActivity } from "./handlers";
import { inviteNewUser, inviteExistingUser } from "./invite";
import { sendInviteEmail } from "./mailer";

export async function listMembers({ workspaceId, userId }) {
  const rows = await many(
    `SELECT m.id, m.user_id AS "userId", u.name, u.email,
            m.role, m.status, m.joined_at AS "joinedAt",
            m.workspace_id AS "workspaceId"
       FROM memberships m
       JOIN users u ON u.id = m.user_id
      WHERE m.workspace_id = $1
      ORDER BY m.joined_at ASC`,
    [workspaceId]
  );

  const members = rows.map((m) => ({
    id: m.id,
    userId: m.userId,
    workspaceId: m.workspaceId,
    name: m.name,
    email: m.email,
    role: capitalize(m.role),
    rawRole: m.role,
    status: capitalize(m.status),
    rawStatus: m.status,
    joined: new Date(m.joinedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  }));

  return { members, currentUserId: userId };
}

export async function listRegisteredUsers({ workspaceId, q }) {
  const params = [workspaceId];
  let filter = "";
  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    filter = `AND (LOWER(u.name) LIKE $2 OR LOWER(u.email) LIKE $2)`;
  }

  const users = await many(
    `SELECT u.id, u.name, u.email
       FROM users u
      WHERE u.password_hash IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM memberships m
           WHERE m.workspace_id = $1 AND m.user_id = u.id
        )
      ${filter}
      ORDER BY LOWER(u.name) ASC
      LIMIT 200`,
    params
  );

  return { users };
}

export async function sendInvite({
  session,
  workspaceId,
  userId,
  name,
  email,
  rawEmail,
}) {
  let payload;
  if (userId) {
    const r = await inviteExistingUser({ session, workspaceId, userId });
    if (r.error) return { error: r.error };
    payload = r;
  } else {
    const targetEmail = rawEmail || email;
    const r = await inviteNewUser({
      session,
      workspaceId,
      name,
      email: targetEmail,
    });
    if (r.error) return { error: r.error };
    payload = r;

    if (payload.needsSetup) {
      const ws = await one(`SELECT name FROM workspaces WHERE id = $1`, [
        workspaceId,
      ]);
      const inviter = await one(`SELECT name FROM users WHERE id = $1`, [
        session.userId,
      ]);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const setupUrl = `${appUrl}/set-password?token=${payload.token}`;

      await sendInviteEmail({
        to: payload.email,
        setupUrl,
        workspaceName: ws?.name || "a workspace",
        inviterName: inviter?.name || "An admin",
        role: payload.role,
      });

      const body = {
        user: {
          id: payload.userId,
          name: payload.name,
          email: payload.email,
        },
        role: payload.role,
        setupUrl, // dev: also visible to caller
      };
      return { body };
    }
  }

  const body = {
    user: {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
    },
    role: payload.role,
  };
  return { body };
}