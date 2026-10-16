// app/api/auth/forgot-password/route.js
import { NextResponse } from "next/server";
import { one, query } from "@/lib/db";
import { generateToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email } = body || {};
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await one(
    `SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );

  // Always return the same response, whether or not the email exists.
  // This prevents account enumeration.
  const okResponse = NextResponse.json({
    ok: true,
    message: "If that email exists, a reset link was sent.",
  });

  if (!user) return okResponse;

  const token = generateToken();
  await query(
    `INSERT INTO reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
    [user.id, token]
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const mail = await sendPasswordResetEmail({ to: user.email, resetUrl });
  if (!mail.ok) {
    console.warn("[forgot-password] mail failed:", mail.error);
  }

  // NOTE: we deliberately do NOT return the reset URL to the client,
  // even in development. The link is delivered by email only.
  return okResponse;
}