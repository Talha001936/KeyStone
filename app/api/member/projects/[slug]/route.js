// app/api/member/projects/[slug]/route.js
import { requireSession, requireRole } from "@/lib/auth";
import { errors, ok } from "@/lib/http";
import { findProjectBySlug } from "@/lib/slug-resolve";
import { getProjectWithTasks } from "@/lib/projects";

const ROLE = "member";

export async function GET(request, ctx) {
  const { slug } = await ctx.params;
  const { session, error } = await requireSession();
  if (error) return error;

  const project = await findProjectBySlug(session.userId, slug);
  if (!project) return errors.notFound("Project");

  const roleRes = await requireRole(session.userId, project.workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const result = await getProjectWithTasks({
    project,
    userId: session.userId,
    role: ROLE,
  });

  return ok({ ...result, role: roleRes.membership.role });
}

export async function PATCH() {
  return errors.forbidden();
}
export async function DELETE() {
  return errors.forbidden();
}