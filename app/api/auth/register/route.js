// app/api/auth/register/route.js
import { NextResponse } from "next/server";
import { one, transaction } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  encodeSession,
  sessionCookieOptions,
} from "@/lib/session";
import { logActivity } from "@/lib/handlers";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, email, password } = body || {};

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address." },
      { status: 400 }
    );
  }

  const existing = await one(
    `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  if (existing) {
    return NextResponse.json(
      { error: "Email already registered." },
      { status: 409 }
    );
  }

  const passwordHash = hashPassword(password);

  try {
    const result = await transaction(async (client) => {
      const insertUser = await client.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, LOWER($2), $3)
         RETURNING id, name, email`,
        [name.trim(), email, passwordHash]
      );
      const user = insertUser.rows[0];

      const userCount = await client.query(
        `SELECT COUNT(*)::int AS c FROM users`
      );
      const isFirst = userCount.rows[0].c === 1;

      let workspaceId = null;
      let role = null;

      if (isFirst) {
        const base =
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 40) || "workspace";
        const slug = `${base}-${Date.now().toString(36).slice(-4)}`;

        const wsRow = await client.query(
          `INSERT INTO workspaces (name, slug, owner_id)
           VALUES ($1, $2, $3)
           RETURNING id, name, slug`,
          [`${name.trim()}'s Workspace`, slug, user.id]
        );
        workspaceId = wsRow.rows[0].id;

        await client.query(
          `INSERT INTO memberships (workspace_id, user_id, role, status)
           VALUES ($1, $2, 'owner', 'active')`,
          [workspaceId, user.id]
        );
        role = "owner";

        await logActivity({
          client,
          workspaceId,
          actorId: user.id,
          type: "workspace_created",
          detail: `created workspace ${wsRow.rows[0].name}`,
        });
      }

      return { user, workspaceId, role };
    });

    // If the user has no workspace yet, do NOT create a session.
    // They must log in after being invited to a workspace.
    if (!result.workspaceId) {
      return NextResponse.json(
        {
          user: result.user,
          workspaceId: null,
          role: null,
          requiresInvite: true,
          message:
            "Account created. Ask a workspace Owner or Admin to invite you, then log in.",
        },
        { status: 201 }
      );
    }

    const session = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
    };
    const res = NextResponse.json(
      {
        user: result.user,
        workspaceId: result.workspaceId,
        role: result.role,
      },
      { status: 201 }
    );
    res.cookies.set(
      SESSION_COOKIE,
      encodeSession(session),
      sessionCookieOptions()
    );
    return res;
  } catch (err) {
    console.error("[/api/auth/register]", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}