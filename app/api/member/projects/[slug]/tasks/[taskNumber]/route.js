// app/api/member/projects/[slug]/tasks/[taskNumber]/route.js
import { requireSession, requireRole } from "@/lib/auth";
import { errors, ok } from "@/lib/http";
import { findTaskBySlugAndNumber } from "@/lib/slug-resolve";
import { taskResponse, updateTask } from "@/lib/tasks";

const ROLE = "member";

export async function GET(request, ctx) {
  const { slug, taskNumber } = await ctx.params;
  const { session, error } = await requireSession();
  if (error) return error;

  const task = await findTaskBySlugAndNumber(session.userId, slug, taskNumber);
  if (!task) return errors.notFound("Task");

  const roleRes = await requireRole(session.userId, task.workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  return ok(taskResponse(task, ROLE, roleRes.membership.role, session.userId));
}

export async function PATCH(request, ctx) {
  const { slug, taskNumber } = await ctx.params;
  const { session, error } = await requireSession();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return errors.badRequest("Invalid JSON body.");
  }

  const task = await findTaskBySlugAndNumber(session.userId, slug, taskNumber);
  if (!task) return errors.notFound("Task");

  const roleRes = await requireRole(session.userId, task.workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  // Pass _version from the body to the shared updateTask logic
  const result = await updateTask({
    session,
    task,
    updates: body,
    membershipRole: roleRes.membership.role,
  });

  if (result.error) return result.error;
  return ok({ task: result.task });
}

export async function DELETE() {
  return errors.forbidden();
}