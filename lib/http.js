// lib/http.js
import { pgErrorToHttp } from "./db";

/** Standard success response. */
export function ok(data, init) {
  return Response.json(data, init);
}

/** Standard error response: `{ error, code? }`. */
export function fail(status, message, code) {
  const body = { error: message };
  if (code) body.code = code;
  return Response.json(body, { status });
}

export const errors = {
  unauthorized: () => fail(401, "Unauthorized"),
  forbidden: () => fail(403, "Access denied"),
  notFound: (what = "Resource") => fail(404, `${what} not found`),
  badRequest: (msg) => fail(400, msg),
  conflict: (msg, code = "CONFLICT") => fail(409, msg, code),
  server: (msg = "Internal server error") => fail(500, msg),
};

/** Parse ?page=&pageSize= with sane bounds. */
export function parsePagination(
  searchParams,
  { defaultSize = 20, maxSize = 100 } = {}
) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const rawSize = parseInt(
    searchParams.get("pageSize") || String(defaultSize),
    10
  );
  const pageSize = Math.min(
    maxSize,
    Math.max(1, Number.isFinite(rawSize) ? rawSize : defaultSize)
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}