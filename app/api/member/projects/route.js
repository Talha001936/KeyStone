// app/api/member/projects/route.js
import { requireSession, requireRole, resolveWorkspaceId } from "@/lib/auth";
import { errors, ok, parsePagination } from "@/lib/http";
import { listProjects } from "@/lib/projects";

const ROLE = "member";

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
  if (!workspaceId) return ok({ projects: [], total: 0, page: 1, pageSize: 20 });

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return errors.forbidden();

  const { page, pageSize, offset } = parsePagination(searchParams);
  const result = await listProjects({
    workspaceId,
    page,
    pageSize,
    offset,
    role: ROLE,
    memberId: session.userId,
  });

  return ok({ ...result, page, pageSize });
}

export async function POST() {
  return errors.forbidden();
}