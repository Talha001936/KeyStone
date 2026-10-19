// app/api/auth/set-password/route.js
import { NextResponse } from "next/server";
import { one, transaction } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { logActivity } from "@/lib/handlers";
import { SESSION_COOKIE } from "@/lib/session";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token is required." }, { status: 400 });

  const row = await one(
    `SELECT t.id, t.user_id AS "userId", t.expires_at AS "expiresAt",
            t.used, u.name, u.email, u.password_hash AS "passwordHash",
            w.name AS "workspaceName", w.id AS "workspaceId", w.slug AS "workspaceSlug",
            m.role
       FROM setup_tokens t
       JOIN users u ON u.id = t.user_id
       JOIN workspaces w ON w.id = t.workspace_id
       LEFT JOIN memberships m ON m.workspace_id = t.workspace_id AND m.user_id = t.user_id
      WHERE t.token = $1`,
    [token]
  );
  if (!row) return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
  if (row.used) return NextResponse.json({ error: "This link has already been used." }, { status: 400 });
  if (new Date(row.expiresAt) < new Date()) return NextResponse.json({ error: "This link has expired." }, { status: 400 });

  return NextResponse.json({
    invite: {
      name: row.name, email: row.email, workspaceName: row.workspaceName,
      workspaceSlug: row.workspaceSlug, role: row.role, hasPassword: !!row.passwordHash,
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

  const { token, password } = body || {};
  if (!token) return NextResponse.json({ error: "Token is required." }, { status: 400 });

  try {
    const result = await transaction(async (client) => {
      const lock = await client.query(
        `SELECT t.id, t.user_id, t.workspace_id, t.expires_at, t.used, u.password_hash AS "passwordHash", u.email
           FROM setup_tokens t JOIN users u ON u.id = t.user_id WHERE t.token = $1 FOR UPDATE`,
        [token]
      );
      const t = lock.rows[0];
      
      if (!t) throw Object.assign(new Error("bad"), { __code: "INVALID" });
      if (t.used) throw Object.assign(new Error("used"), { __code: "USED" });
      if (new Date(t.expires_at) < new Date()) throw Object.assign(new Error("expired"), { __code: "EXPIRED" });

      let user;
      let alreadyRegistered = false;

      if (t.passwordHash) {
        // User is already part of the system! Auto-verify them.
        alreadyRegistered = true;
        const u = await client.query(`SELECT id, name, email FROM users WHERE id = $1`, [t.user_id]);
        user = u.rows[0];
      } else {
        // Brand new user, require password.
        if (!password || password.length < 8) {
          throw Object.assign(new Error("short_password"), { __code: "SHORT_PASSWORD" });
        }
        const hash = hashPassword(password);
        const u = await client.query(`UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, name, email`, [hash, t.user_id]);
        user = u.rows[0];
      }

      // Activate membership
      const m = await client.query(`UPDATE memberships SET status = 'active' WHERE workspace_id = $1 AND user_id = $2 RETURNING role`, [t.workspace_id, t.user_id]);
      await client.query(`UPDATE setup_tokens SET used = TRUE WHERE id = $1`, [t.id]);

      await logActivity({
        client, workspaceId: t.workspace_id, actorId: user.id,
        type: "member_joined", detail: `${user.email} joined the workspace`,
      });

      return { user, role: m.rows[0]?.role || "member", alreadyRegistered };
    });

    const res = NextResponse.json({ 
      ok: true, 
      alreadyRegistered: result.alreadyRegistered,
      email: result.user.email,
      role: result.role
    }, { status: 200 });
    
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    if (err.__code === "INVALID") return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
    if (err.__code === "USED") return NextResponse.json({ error: "This link has already been used." }, { status: 400 });
    if (err.__code === "EXPIRED") return NextResponse.json({ error: "This link has expired." }, { status: 400 });
    if (err.__code === "SHORT_PASSWORD") return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    console.error("[/api/auth/set-password]", err);
    return NextResponse.json({ error: "Failed to join workspace." }, { status: 500 });
  }
}