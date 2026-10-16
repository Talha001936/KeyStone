// lib/team.js
import { one, many, transaction } from "./db";
import { errors } from "./http";
import { capitalize, logActivity } from "./handlers";
import {
  resolveInviteTarget,
  determineInviteRole,
  generateToken,
} from "./invite";
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
  const queryParams = [workspaceId];
  let filter = "";
  if (q) {
    queryParams.push(`%${q.toLowerCase()}%`);
    filter = `AND (LOWER(u.name) LIKE $2 OR LOWER(u.email) LIKE $2)`;
  }

  const users = await many(
    `SELECT u.id, u.name, u.email
       FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM memberships m
         WHERE m.workspace_id = $1 AND m.user_id = u.id
      )
      ${filter}
      ORDER BY LOWER(u.name) ASC
      LIMIT 200`,
    queryParams
  );

  const pendingRows = await many(
    `SELECT user_id AS "userId"
       FROM invites
      WHERE workspace_id = $1
        AND status = 'pending'
        AND expires_at > NOW()
        AND user_id IS NOT NULL`,
    [workspaceId]
  );
  const pendingSet = new Set(pendingRows.map((r) => r.userId));

  const enriched = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    hasPendingInvite: pendingSet.has(u.id),
  }));

  return { users: enriched };
}


export async function sendInvite({
  session,
  workspaceId,
  userId,
  rawEmail,
  role,
}) {
  const { user: targetUser, error: targetErr } = await resolveInviteTarget({
    userId,
    email: rawEmail,
  });
  if (targetErr) return { error: targetErr };

  const existingMembership = await one(
    `SELECT id FROM memberships
      WHERE workspace_id = $1 AND user_id = $2`,
    [workspaceId, targetUser.id]
  );
  if (existingMembership)
    return {
      error: errors.conflict("User is already a member of this workspace."),
    };

  const existingInvite = await one(
    `SELECT id FROM invites
      WHERE workspace_id = $1
        AND user_id = $2
        AND status = 'pending'
        AND expires_at > NOW()`,
    [workspaceId, targetUser.id]
  );
  if (existingInvite)
    return {
      error: errors.conflict("An invite has already been sent to this user."),
    };

  const inviteRole = await determineInviteRole(workspaceId);
  const token = generateToken();

  const invite = await transaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO invites
         (workspace_id, email, user_id, role, token, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days')
       RETURNING id, email, role, token, created_at AS "createdAt"`,
      [
        workspaceId,
        targetUser.email.toLowerCase(),
        targetUser.id,
        inviteRole,
        token,
        session.userId,
      ]
    );

    await logActivity({
      client,
      workspaceId,
      actorId: session.userId,
      type: "member_invited",
      detail: `invited ${targetUser.email} as ${inviteRole}`,
      to: inviteRole,
    });

    return ins.rows[0];
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acceptUrl = `${appUrl}/accept-invite?token=${token}`;

  const ws = await one(`SELECT name FROM workspaces WHERE id = $1`, [
    workspaceId,
  ]);
  const inviter = await one(`SELECT name FROM users WHERE id = $1`, [
    session.userId,
  ]);

  await sendInviteEmail({
    to: targetUser.email,
    acceptUrl,
    workspaceName: ws?.name || "a workspace",
    inviterName: inviter?.name || "An admin",
    role: inviteRole,
  });

  const responseBody = {
    invite,
    acceptUrl,
    user: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
    },
  };
  if (process.env.NODE_ENV !== "production") {
    responseBody.devAcceptUrl = acceptUrl;
  }

  return { body: responseBody };
}