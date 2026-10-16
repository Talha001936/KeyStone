// app/api/owner/projects/[slug]/tasks/[taskNumber]/comments/route.js
import { requireSession, requireRole } from "@/lib/auth";
import { errors, ok } from "@/lib/http";
import { findTaskBySlugAndNumber } from "@/lib/slug-resolve";
import { listComments, createComment } from "@/lib/comments";

const ROLE = "owner";

export async function GET(request, ctx) {
  const { slug, taskNumber } = await ctx.params;
  const { session, error } = await requireSession();
  if (error) return error;

  const task = await findTaskBySlugAndNumber(session.userId, slug, taskNumber);
  if (!task) return errors.notFound("Task");

  const roleRes = await requireRole(session.userId, task.workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const { searchParams } = new URL(request.url);
  const result = await listComments({ task, searchParams });
  return ok(result);
}

export async function POST(request, ctx) {
  const { slug, taskNumber } = await ctx.params;
  const { session, error } = await requireSession();
  if (error) return error;

  const task = await findTaskBySlugAndNumber(session.userId, slug, taskNumber);
  if (!task) return errors.notFound("Task");

  const roleRes = await requireRole(session.userId, task.workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const isAssignee = task.assignee_id === session.userId;
  const isPrivileged = ["owner", "admin"].includes(roleRes.membership.role);
  if (!isAssignee && !isPrivileged) return errors.forbidden();

  let body;
  try {
    body = await request.json();
  } catch {
    return errors.badRequest("Invalid JSON body.");
  }

  const result = await createComment({
    session,
    task,
    text: body?.body,
  });
  if (result.error) return result.error;
  return ok({ comment: result.comment }, { status: 201 });
}