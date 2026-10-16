// app/api/owner/team/registered/route.js
import { requireSession, requireRole, resolveWorkspaceId } from "@/lib/auth";
import { errors, ok } from "@/lib/http";
import { listRegisteredUsers } from "@/lib/team";

const ROLE = "owner";

export async function GET(request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  let workspaceId;
  try {
    workspaceId = await resolveWorkspaceId(
      session.userId,
      searchParams.get("workspaceId")
    );
  } catch (e) {
    return e.__http || errors.forbidden();
  }
  if (!workspaceId) return errors.badRequest("No workspace.");

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const result = await listRegisteredUsers({ workspaceId, q });
  return ok(result);
}