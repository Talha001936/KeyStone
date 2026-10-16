// app/api/owner/activities/stream/route.js
import { requireSession, requireRole, resolveWorkspaceId } from "@/lib/auth";
import { buildActivitiesStream } from "@/lib/activities";

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
    return e.__http || new Response("Forbidden", { status: 403 });
  }
  if (!workspaceId) return new Response("No workspace", { status: 400 });

  const roleRes = await requireRole(session.userId, workspaceId, [ROLE]);
  if (roleRes.error) return new Response("Forbidden", { status: 403 });

  const sinceParam = searchParams.get("since");
  let since = sinceParam ? new Date(sinceParam) : new Date();
  if (Number.isNaN(since.getTime())) since = new Date();

  const stream = buildActivitiesStream({ workspaceId, since, request });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}