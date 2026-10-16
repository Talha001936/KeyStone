// app/api/auth/accept-invite/route.js
import { NextResponse } from "next/server";
import { one, transaction } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  encodeSession,
  sessionCookieOptions,
} from "@/lib/session";
import { logActivity } from "@/lib/handlers";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token)
    return NextResponse.json({ error: "Token is required." }, { status: 400 });

  const invite = await one(
    `SELECT i.id, i.email, i.role, i.status, i.expires_at AS "expiresAt",
            i.user_id AS "userId",
            w.name AS "workspaceName",
            u.name AS "existingName"
       FROM invites i
       JOIN workspaces w ON w.id = i.workspace_id
       LEFT JOIN users u ON u.id = i.user_id
      WHERE i.token = $1`,
    [token]
  );
  if (!invite)
    return NextResponse.json({ error: "Invalid invite." }, { status: 404 });
  if (invite.status !== "pending")
    return NextResponse.json({ error: "Invite already used." }, { status: 400 });
  if (new Date(invite.expiresAt) < new Date())
    return NextResponse.json({ error: "Invite has expired." }, { status: 400 });

  return NextResponse.json({
    invite: {
      email: invite.email,
      role: invite.role,
      workspaceName: invite.workspaceName,
      hasAccount: !!invite.userId,
      existingName: invite.existingName || "",
    },
  });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { token, name, password } = body || {};
  if (!token) {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  const invite = await one(
    `SELECT id, workspace_id AS "workspaceId", email, role, status,
            user_id AS "userId", expires_at AS "expiresAt"
       FROM invites WHERE token = $1`,
    [token]
  );
  if (!invite)
    return NextResponse.json({ error: "Invalid invite." }, { status: 404 });
  if (invite.status !== "pending")
    return NextResponse.json({ error: "Invite already used." }, { status: 400 });
  if (new Date(invite.expiresAt) < new Date())
    return NextResponse.json({ error: "Invite has expired." }, { status: 400 });

  try {
    const result = await transaction(async (client) => {
      const lock = await client.query(
        `SELECT id FROM invites WHERE id = $1 AND status = 'pending' FOR UPDATE`,
        [invite.id]
      );
      if (lock.rowCount === 0) {
        throw Object.assign(new Error("used"), { __code: "USED" });
      }

      let user = null;

      if (invite.userId) {
        const res = await client.query(
          `SELECT id, name, email FROM users WHERE id = $1`,
          [invite.userId]
        );
        user = res.rows[0] || null;
      }

      if (!user) {
        const res = await client.query(
          `SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)`,
          [invite.email]
        );
        user = res.rows[0] || null;
      }

      if (!user) {
        if (!name || !password || password.length < 8) {
          throw Object.assign(new Error("missing"), {
            __code: "MISSING_FIELDS",
          });
        }
        const created = await client.query(
          `INSERT INTO users (name, email, password_hash)
           VALUES ($1, LOWER($2), $3)
           RETURNING id, name, email`,
          [name.trim(), invite.email, hashPassword(password)]
        );
        user = created.rows[0];
      }

      const existing = await client.query(
        `SELECT id FROM memberships WHERE workspace_id = $1 AND user_id = $2`,
        [invite.workspaceId, user.id]
      );
      if (!existing.rows[0]) {
        await client.query(
          `INSERT INTO memberships (workspace_id, user_id, role, status)
           VALUES ($1, $2, $3, 'active')`,
          [invite.workspaceId, user.id, invite.role]
        );
      }

      await client.query(
        `UPDATE invites
            SET status = 'accepted', accepted_at = NOW(), user_id = $1
          WHERE id = $2`,
        [user.id, invite.id]
      );

      await logActivity({
        client,
        workspaceId: invite.workspaceId,
        actorId: user.id,
        type: "member_joined",
        detail: `${user.email} joined as ${invite.role}`,
      });

      return { user, workspaceId: invite.workspaceId, role: invite.role };
    });

    const session = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
    };
    const res = NextResponse.json(result, { status: 201 });
    res.cookies.set(
      SESSION_COOKIE,
      encodeSession(session),
      sessionCookieOptions()
    );
    return res;
  } catch (err) {
    if (err.__code === "USED") {
      return NextResponse.json(
        { error: "Invite already used." },
        { status: 400 }
      );
    }
    if (err.__code === "MISSING_FIELDS") {
      return NextResponse.json(
        { error: "Name and password (8+ chars) are required." },
        { status: 400 }
      );
    }
    console.error("[/api/auth/accept-invite]", err);
    return NextResponse.json(
      { error: "Failed to accept invite." },
      { status: 500 }
    );
  }
}