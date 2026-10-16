export async function DELETE(request, ctx) {
  if (ROLE !== "owner") return errors.forbidden();
  const { workspaceId } = await ctx.params;

  const { session, error } = await requireSession();
  if (error) return error;

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();
  if (roleRes.membership.role !== "owner") return errors.forbidden();

  // ---- Blocked if the workspace still has content ----
  const members = await one(
    `SELECT COUNT(*)::int AS c FROM memberships
      WHERE workspace_id = $1 AND status = 'active'`,
    [workspaceId]
  );
  const projects = await one(
    `SELECT COUNT(*)::int AS c FROM projects WHERE workspace_id = $1`,
    [workspaceId]
  );
  const tasks = await one(
    `SELECT COUNT(*)::int AS c FROM tasks WHERE workspace_id = $1`,
    [workspaceId]
  );

  const extraMembers = Math.max(0, (members?.c || 0) - 1);
  if (extraMembers > 0 || (projects?.c || 0) > 0 || (tasks?.c || 0) > 0) {
    return errors.badRequest(
      "This workspace still has members, projects, or tasks. Remove them before deleting the workspace."
    );
  }

  await query(`DELETE FROM workspaces WHERE id = $1`, [workspaceId]);
  return ok({ ok: true });
}