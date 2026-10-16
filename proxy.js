import { NextResponse } from "next/server";
import { decodeSession } from "@/lib/session";

const SESSION_COOKIE = "tf_session";

const PUBLIC_PAGES = [
  "/",
  "/about",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/accept-invite",
];

const PUBLIC_APIS = ["/api/auth"];

const PROTECTED_PAGES = ["/owner", "/admin", "/member"];

function safeNext(path) {
  if (typeof path !== "string") return null;
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//")) return null;
  return path;
}

function matchesPrefix(pathname, prefix) {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

function isPublicPage(pathname) {
  return PUBLIC_PAGES.some((p) => matchesPrefix(pathname, p));
}

function isPublicApi(pathname) {
  return PUBLIC_APIS.some((p) => matchesPrefix(pathname, p));
}

function isProtectedPage(pathname) {
  return PROTECTED_PAGES.some((p) => matchesPrefix(pathname, p));
}

export function proxy(request) {
  const { pathname, search } = request.nextUrl;

  const rawCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const session = decodeSession(rawCookie);
  const isAuthed = !!session;

  // 1. Public pages — always render as-is, even for authenticated users.
  if (isPublicPage(pathname)) {
    return NextResponse.next();
  }

  // 2. Public APIs — /api/auth/* handles its own authorization.
  if (isPublicApi(pathname)) {
    return NextResponse.next();
  }

  // 3. All other APIs require a session. Role checks live in the handlers.
  if (pathname.startsWith("/api")) {
    if (!isAuthed) {
      return NextResponse.json(
        { error: "Unauthorized", code: "NO_SESSION" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 4. Protected pages — /owner, /admin, /member.
  if (isProtectedPage(pathname)) {
    if (!isAuthed) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      const target = safeNext(pathname + (search || ""));
      if (target) url.searchParams.set("next", target);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 5. Anything else — let Next.js handle it (404, static, etc.).
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf|css|js|map)$).*)",
  ],
};