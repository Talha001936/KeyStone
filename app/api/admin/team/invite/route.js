// app/api/owner/team/invite/route.js
import { requireSession, requireRole, resolveWorkspaceId } from "@/lib/auth";
import { errors, ok } from "@/lib/http";
import { sendInvite } from "@/lib/team";

const ROLE = "admin";

export async function POST(request) {
  const { session, error } = await requireSession();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return errors.badRequest("Invalid JSON body.");
  }

  const { userId, email: rawEmail, workspaceId: inputWs } = body || {};

  let workspaceId;
  try {
    workspaceId = await resolveWorkspaceId(session.userId, inputWs);
  } catch (e) {
    return e.__http || errors.forbidden();
  }
  if (!workspaceId) return errors.badRequest("No workspace.");

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const result = await sendInvite({
    session,
    workspaceId,
    userId,
    rawEmail,
    role: ROLE,
  });
  if (result.error) return result.error;
  return ok(result.body, { status: 201 });
}