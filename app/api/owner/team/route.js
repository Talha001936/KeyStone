// app/api/owner/team/route.js
import { requireSession, requireRole, resolveWorkspaceId } from "@/lib/auth";
import { errors, ok } from "@/lib/http";
import { listMembers } from "@/lib/team";

const ROLE = "owner";

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
  if (!workspaceId) {
    return ok({
      members: [],
      currentUserId: session.userId,
      currentRole: null,
    });
  }

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const result = await listMembers({
    workspaceId,
    userId: session.userId,
  });
  return ok({
    ...result,
    currentRole: roleRes.membership.role,
  });
}