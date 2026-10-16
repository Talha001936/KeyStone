// app/api/owner/tasks/route.js
import { requireSession, requireRole, resolveWorkspaceId } from "@/lib/auth";
import { errors, ok } from "@/lib/http";
import { listTasks, createTask } from "@/lib/tasks";

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
  if (!workspaceId) return ok({ tasks: [], total: 0, page: 1, pageSize: 20 });

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const result = await listTasks({ session, workspaceId, searchParams, role: ROLE });
  return ok(result);
}

export async function POST(request) {
  const { session, error } = await requireSession();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return errors.badRequest("Invalid JSON body.");
  }

  let workspaceId;
  try {
    workspaceId = await resolveWorkspaceId(session.userId, body.workspaceId);
  } catch (e) {
    return e.__http || errors.forbidden();
  }
  if (!workspaceId) return errors.badRequest("No workspace.");

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const result = await createTask({ session, workspaceId, body });
  if (result.error) return result.error;
  return ok({ task: result.task }, { status: 201 });
}