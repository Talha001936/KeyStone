// lib/session.js
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "tf_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; 

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set and at least 32 characters long."
    );
  }
  return s;
}

function sign(payloadB64) {
  return createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

export function encodeSession(payload) {
  const body = {
    ...payload,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const b64 = Buffer.from(JSON.stringify(body), "utf-8").toString("base64url");
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

export function decodeSession(raw) {
  if (!raw || typeof raw !== "string") return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;

  const b64 = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);

  let expected;
  try {
    expected = sign(b64);
  } catch {
    return null;
  }

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const json = Buffer.from(b64, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    if (!parsed?.userId) return null;
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  return decodeSession(raw);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}