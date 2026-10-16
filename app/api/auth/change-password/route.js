// app/api/auth/change-password/route.js
import { NextResponse } from "next/server";
import { one, query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSession } from "@/lib/session";

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { currentPassword, newPassword } = body || {};
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const user = await one(
    `SELECT id, password_hash AS "passwordHash" FROM users WHERE id = $1`,
    [session.userId]
  );
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 }
    );
  }

  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
    hashPassword(newPassword),
    user.id,
  ]);

  return NextResponse.json({ ok: true });
}