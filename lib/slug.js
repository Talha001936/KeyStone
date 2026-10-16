// lib/slug.js

export function slugify(name, { maxLen = 60 } = {}) {
  const base = String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "");
  return base || "project";
}

export async function uniqueProjectSlug(client, workspaceId, baseSlug) {
  const clean = await client.query(
    `SELECT 1 FROM projects WHERE workspace_id = $1 AND slug = $2`,
    [workspaceId, baseSlug]
  );
  if (clean.rows.length === 0) return baseSlug;

  for (let n = 2; n <= 50; n++) {
    const candidate = `${baseSlug}-${n}`;
    const { rows } = await client.query(
      `SELECT 1 FROM projects WHERE workspace_id = $1 AND slug = $2`,
      [workspaceId, candidate]
    );
    if (rows.length === 0) return candidate;
  }

  for (let i = 0; i < 20; i++) {
    const candidate = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    const { rows } = await client.query(
      `SELECT 1 FROM projects WHERE workspace_id = $1 AND slug = $2`,
      [workspaceId, candidate]
    );
    if (rows.length === 0) return candidate;
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}