// lib/mailer.js
import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } =
    process.env;

  if (!SMTP_HOST) {
    transporter = {
      async sendMail(opts) {
        console.log("\n─────────── EMAIL fallback if fails to send email ");
        console.log("To:      ", opts.to);
        console.log("Subject: ", opts.subject);
        console.log("Text:\n", opts.text);
       
        return { messageId: "dev-fallback" };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === "true",
    auth:
      SMTP_USER && SMTP_PASS
        ? { user: SMTP_USER, pass: SMTP_PASS }
        : undefined,
  });
  return transporter;
}

const FROM =
  process.env.MAIL_FROM ||
  process.env.SMTP_USER ||
  "Keystone <no-reply@keystone.app>";

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const subject = "Reset your Keystone password";
  const text = `You requested a password reset.

Click the link below to set a new password. It expires in 15 minutes.

${resetUrl}

If you didn't request this, you can safely ignore this email.`;

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#463f3a">
      <h2 style="margin:0 0 8px">Reset your password</h2>
      <p style="color:#5c5550">We received a request to reset your Keystone password.</p>
      <p style="margin:24px 0">
        <a href="${resetUrl}"
           style="display:inline-block;background:#463f3a;color:#f4f3ee;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Reset password
        </a>
      </p>
      <p style="font-size:13px;color:#8a817c">This link expires in 15 minutes. If you didn't request it, you can ignore this email.</p>
      <p style="font-size:12px;color:#8a817c;word-break:break-all">${resetUrl}</p>
    </div>
  `;

  try {
    await getTransporter().sendMail({ from: FROM, to, subject, text, html });
    return { ok: true };
  } catch (err) {
    console.error("[mailer] sendPasswordResetEmail failed:", err);
    return { ok: false, error: err.message };
  }
}

export async function sendInviteEmail({
  to,
  setupUrl,
  workspaceName,
  inviterName,
  role,
}) {
  const subject = `You're invited to ${workspaceName} on Keystone`;
  const text = `${inviterName || "An admin"} invited you to join "${workspaceName}" as ${role}.

Set your password to join:
${setupUrl}

This link expires in 7 days.`;

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#463f3a">
      <h2 style="margin:0 0 8px">You're invited to ${workspaceName}</h2>
      <p style="color:#5c5550">${inviterName || "An admin"} invited you to join as <strong>${role}</strong>.</p>
      <p style="margin:24px 0">
        <a href="${setupUrl}"
           style="display:inline-block;background:#463f3a;color:#f4f3ee;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Set your password
        </a>
      </p>
      <p style="font-size:13px;color:#8a817c">This link expires in 7 days.</p>
      <p style="font-size:12px;color:#8a817c;word-break:break-all">${setupUrl}</p>
    </div>
  `;

  try {
    await getTransporter().sendMail({ from: FROM, to, subject, text, html });
    return { ok: true };
  } catch (err) {
    console.error("[mailer] sendInviteEmail failed:", err);
    return { ok: false, error: err.message };
  }
}