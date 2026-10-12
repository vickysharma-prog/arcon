import { accessTo, publicProject } from "@/lib/auth/request";
import { ownerName } from "@/lib/project/team";

export async function GET(request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const a = await accessTo((await ctx.params).id, request.headers.get("cookie"));
  if (!a) return Response.json({ error: "not found" }, { status: 404 });
  // Everyone else on the project sees whose design it is ("Vicky's design").
  return Response.json({ ...publicProject(a.project), role: a.role, ownerName: a.role === "owner" ? null : await ownerName(a.project.owner_id) });
}
