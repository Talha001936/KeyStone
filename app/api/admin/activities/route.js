// app/api/owner/activities/route.js
import { requireSession, requireRole, resolveWorkspaceId } from "@/lib/auth";
import { errors, ok } from "@/lib/http";
import { listActivities } from "@/lib/activities";

const ROLE = "admin";

export async function GET(request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  let workspaceId;
  try {
    workspaceId = await resolveWorkspaceId(
      session.userId,
      searchParams.get("workspaceId")
    );
  } catch (e) {
    return e.__http || errors.forbidden();
  }
  if (!workspaceId)
    return ok({ activities: [], total: 0, page: 1, pageSize: 20 });

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const result = await listActivities({ workspaceId, searchParams });
  return ok(result);
}