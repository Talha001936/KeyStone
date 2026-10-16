// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import { one, many } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  encodeSession,
  sessionCookieOptions,
} from "@/lib/session";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, password } = body || {};
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const user = await one(
    `SELECT id, name, email, password_hash AS "passwordHash"
       FROM users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const memberships = await many(
    `SELECT m.id, m.workspace_id AS "workspaceId", m.role, m.status,
            w.name AS "workspaceName", w.slug AS "workspaceSlug"
       FROM memberships m
       JOIN workspaces w ON w.id = m.workspace_id
      WHERE m.user_id = $1 AND m.status = 'active'
      ORDER BY m.joined_at ASC`,
    [user.id]
  );

  const session = { userId: user.id, email: user.email, name: user.name };
  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
    memberships,
  });

  res.cookies.set(SESSION_COOKIE, encodeSession(session), sessionCookieOptions());
  return res;
}