// app/api/auth/register/route.js
import { NextResponse } from "next/server";
import { one, transaction } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  encodeSession,
  sessionCookieOptions,
} from "@/lib/session";
import { logActivity } from "@/lib/handlers";
import { slugify } from "@/lib/slug";

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

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  const existing = await one(
    `SELECT id, name, email, password_hash AS "passwordHash" 
       FROM users WHERE LOWER(email) = $1`,
    [cleanEmail]
  );

  let userId;

  if (existing) {
    // Verify password first for existing users
    if (!existing.passwordHash) {
      return NextResponse.json(
        { error: "Please complete your invite setup first." },
        { status: 400 }
      );
    }
    if (!verifyPassword(password, existing.passwordHash)) {
      return NextResponse.json(
        { error: "Email already registered. Incorrect password." },
        { status: 401 }
      );
    }

    // Check if they are ALREADY an owner of any workspace
    const isOwner = await one(
      `SELECT 1 FROM memberships 
        WHERE user_id = $1 AND role = 'owner' AND status = 'active'`,
      [existing.id]
    );

    if (isOwner) {
      return NextResponse.json(
        { error: "You already have a workspace. You are not allowed to make another one." },
        { status: 403 }
      );
    }

    userId = existing.id;
  } else {
    // Brand new user
    const passwordHash = hashPassword(password);
    const created = await one(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [cleanName, cleanEmail, passwordHash]
    );
    userId = created.id;
  }

  try {
    const result = await transaction(async (client) => {
      // Get user details
      const u = await client.query(
        `SELECT id, name, email FROM users WHERE id = $1`,
        [userId]
      );
      const user = u.rows[0];

      // Create a new workspace owned by this user
      const wsName = `${cleanName}'s Workspace`;
      const base = slugify(wsName, { maxLen: 40 });

      let slug = base;
      for (let i = 0; i < 20; i++) {
        const dup = await client.query(
          `SELECT 1 FROM workspaces WHERE slug = $1`,
          [slug]
        );
        if (!dup.rows[0]) break;
        slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      }

      const wsRow = await client.query(
        `INSERT INTO workspaces (name, slug, owner_id)
         VALUES ($1, $2, $3)
         RETURNING id, name, slug`,
        [wsName, slug, user.id]
      );
      const workspace = wsRow.rows[0];

      await client.query(
        `INSERT INTO memberships (workspace_id, user_id, role, status)
         VALUES ($1, $2, 'owner', 'active')`,
        [workspace.id, user.id]
      );

      await logActivity({
        client,
        workspaceId: workspace.id,
        actorId: user.id,
        type: "workspace_created",
        detail: `created workspace ${workspace.name}`,
      });

      return { user, workspace };
    });

    const session = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
    };
    const res = NextResponse.json(
      {
        user: result.user,
        workspaceId: result.workspace.id,
        role: "owner",
      },
      { status: 201 }
    );
    
    // Set the cookie
    res.cookies.set(
      SESSION_COOKIE,
      encodeSession(session),
      sessionCookieOptions()
    );
    
    // IMMEDIATELY clear it to force the user to log in fresh
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    
    return res;
  } catch (err) {
    console.error("[/api/auth/register]", err);
    return NextResponse.json(
      { error: "Failed to create workspace." },
      { status: 500 }
    );
  }
}