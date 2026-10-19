// lib/invite.js
import { one, transaction } from "./db";
import { errors } from "./http";
import { generateToken } from "./tokens";
import { logActivity } from "./handlers";

export async function inviteNewUser({ session, workspaceId, name, email }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanName) return { error: errors.badRequest("Name is required.") };
  if (cleanName.length < 2 || cleanName.length > 80)
    return { error: errors.badRequest("Name must be 2–80 characters.") };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
    return { error: errors.badRequest("Invalid email address.") };

  const result = await transaction(async (client) => {
    const existing = await client.query(
      `SELECT id, password_hash FROM users WHERE LOWER(email) = $1`,
      [cleanEmail]
    );
    
    if (existing.rows[0]) {
      const u = existing.rows[0];
      const existingMember = await client.query(
        `SELECT id FROM memberships WHERE workspace_id = $1 AND user_id = $2`,
        [workspaceId, u.id]
      );
      if (existingMember.rows[0]) {
        throw Object.assign(new Error("member"), { __code: "ALREADY_MEMBER" });
      }
      return { userId: u.id, needsSetup: true };
    }

    const created = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, NULL)
       RETURNING id`,
      [cleanName, cleanEmail]
    );
    return { userId: created.rows[0].id, needsSetup: true };
  }).catch((e) => {
    if (e.__code === "ALREADY_MEMBER")
      return { __err: "This person is already in the workspace." };
    throw e;
  });

  if (result.__err) return { error: errors.badRequest(result.__err) };

  const { userId } = result;

  const adminCount = await one(
    `SELECT COUNT(*)::int AS c FROM memberships
      WHERE workspace_id = $1 AND role = 'admin' AND status = 'active'`,
    [workspaceId]
  );
  const role = (adminCount?.c || 0) === 0 ? "admin" : "member";
  const token = generateToken();

  await transaction(async (client) => {
    await client.query(
      `INSERT INTO memberships (workspace_id, user_id, role, status)
       VALUES ($1, $2, $3, 'inactive')
       ON CONFLICT (workspace_id, user_id)
       DO UPDATE SET role = EXCLUDED.role, status = 'inactive'`,
      [workspaceId, userId, role]
    );

    await client.query(
      `INSERT INTO setup_tokens (user_id, workspace_id, token, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [userId, workspaceId, token]
    );

    await logActivity({
      client,
      workspaceId,
      actorId: session.userId,
      type: "member_invited",
      detail: `${cleanName} as ${role}`,
      to: role,
    });
  });

  return { userId, email: cleanEmail, name: cleanName, role, token, needsSetup: true };
}

export async function inviteExistingUser({ session, workspaceId, userId }) {
  const user = await one(
    `SELECT id, name, email, password_hash FROM users WHERE id = $1`,
    [userId]
  );
  if (!user) return { error: errors.badRequest("User not found.") };
  
  const existing = await one(
    `SELECT id FROM memberships WHERE workspace_id = $1 AND user_id = $2`,
    [workspaceId, userId]
  );
  if (existing) return { error: errors.conflict("User is already a member.") };

  const adminCount = await one(
    `SELECT COUNT(*)::int AS c FROM memberships
      WHERE workspace_id = $1 AND role = 'admin' AND status = 'active'`,
    [workspaceId]
  );
  const role = (adminCount?.c || 0) === 0 ? "admin" : "member";

  await transaction(async (client) => {
    await client.query(
      `INSERT INTO memberships (workspace_id, user_id, role, status)
       VALUES ($1, $2, $3, 'active')`,
      [workspaceId, userId, role]
    );
    await logActivity({
      client,
      workspaceId,
      actorId: session.userId,
      type: "member_joined",
      detail: `${user.name} as ${role}`,
      to: role,
    });
  });

  return { userId, email: user.email, name: user.name, role };
}