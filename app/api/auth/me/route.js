// app/api/auth/me/route.js
import { NextResponse } from "next/server";
import { one, many } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await one(
      `SELECT id, name, email FROM users WHERE id = $1`,
      [session.userId]
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const memberships = await many(
      `SELECT m.workspace_id AS "workspaceId", m.role, m.status,
              w.name AS "workspaceName", w.slug AS "workspaceSlug"
         FROM memberships m
         JOIN workspaces w ON w.id = m.workspace_id
        WHERE m.user_id = $1 AND m.status = 'active'
        ORDER BY m.joined_at ASC`,
      [user.id]
    );

    return NextResponse.json({ user, memberships });
  } catch (err) {
    console.error("[/api/auth/me]", err);
    return NextResponse.json(
      { error: "Internal server error", code: err.code || null },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body?.name !== undefined ? String(body.name).trim() : null;
  const email =
    body?.email !== undefined ? String(body.email).trim().toLowerCase() : null;

  if (name !== null && (name.length < 1 || name.length > 80)) {
    return NextResponse.json(
      { error: "Name must be 1–80 characters." },
      { status: 400 }
    );
  }
  if (email !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  try {
    const updated = await one(
      `UPDATE users
          SET name = COALESCE($2, name),
              email = COALESCE($3, email)
        WHERE id = $1
        RETURNING id, name, email`,
      [session.userId, name, email]
    );
    return NextResponse.json({ user: updated });
  } catch (err) {
    if (err.code === "23505") {
      return NextResponse.json(
        { error: "Email already in use." },
        { status: 409 }
      );
    }
    throw err;
  }
}