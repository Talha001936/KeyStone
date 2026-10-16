// lib/db.js
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. See .env.example.");
}

let pool;

if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  global._pgPool.on("error", (err) => {
    console.error("[pg] idle client error", err);
  });
}
pool = global._pgPool;

export async function query(text, params = []) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (process.env.NODE_ENV !== "production") {
    const ms = Date.now() - start;
    if (ms > 500) console.log(`[slow query ${ms}ms]`, text.slice(0, 80));
  }
  return res;
}

export async function one(text, params) {
  const { rows } = await query(text, params);
  return rows[0] || null;
}

export async function many(text, params) {
  const { rows } = await query(text, params);
  return rows;
}

export async function run(text, params) {
  return query(text, params);
}

export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("[db] rollback failed", rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}


export function pgErrorToHttp(err) {
  if (!err || typeof err !== "object") return null;
  switch (err.code) {
    case "23505": // unique_violation
      return { status: 409, error: "That value is already taken." };
    case "23503": // foreign_key_violation
      return { status: 400, error: "Referenced resource does not exist." };
    case "23502": // not_null_violation
      return { status: 400, error: "A required field is missing." };
    case "22P02": // invalid_text_representation (e.g. bad uuid)
      return { status: 400, error: "Invalid identifier format." };
    case "22007": // invalid_datetime_format
    case "22008": // datetime_field_overflow
      return { status: 400, error: "Invalid date format." };
    default:
      return null;
  }
}