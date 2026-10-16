// app/api/auth/reset-password/route.js
import { NextResponse } from "next/server";
import { one, transaction } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { token, password } = body || {};
  if (!token || !password)
    return NextResponse.json(
      { error: "Token and password are required." },
      { status: 400 }
    );
  if (password.length < 8)
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );

  const record = await one(
    `SELECT id, user_id AS "userId", expires_at AS "expiresAt"
       FROM reset_tokens
      WHERE token = $1 AND used = FALSE`,
    [token]
  );
  if (!record)
    return NextResponse.json(
      { error: "Invalid or expired reset link." },
      { status: 400 }
    );
  if (new Date(record.expiresAt) < new Date())
    return NextResponse.json(
      { error: "This reset link has expired." },
      { status: 400 }
    );

  const passwordHash = hashPassword(password);

  await transaction(async (client) => {
    await client.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, record.userId]
    );
    await client.query(`UPDATE reset_tokens SET used = TRUE WHERE id = $1`, [
      record.id,
    ]);
  });

  return NextResponse.json({ ok: true, message: "Password reset successful." });
}