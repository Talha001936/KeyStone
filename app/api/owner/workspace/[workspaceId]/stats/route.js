// app/api/owner/workspace/[workspaceId]/stats/route.js
import { requireSession, requireRole } from "@/lib/auth";
import { one } from "@/lib/db";
import { errors, ok } from "@/lib/http";

const ROLE = "owner";

export async function GET(request, ctx) {
  const { workspaceId } = await ctx.params;

  const { session, error } = await requireSession();
  if (error) return error;

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

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
  const activeTasks = await one(
    `SELECT COUNT(*)::int AS c FROM tasks
      WHERE workspace_id = $1 AND status = 'in_progress'`,
    [workspaceId]
  );

  const stats = {
    members: members?.c || 0,
    projects: projects?.c || 0,
    tasks: tasks?.c || 0,
    activeTasks: activeTasks?.c || 0,
  };

  const blocked =
    stats.members > 1 || // more than just the owner
    stats.projects > 0 ||
    stats.tasks > 0;

  return ok({ stats, canDelete: !blocked });
}