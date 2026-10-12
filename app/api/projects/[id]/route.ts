import { accessTo, publicProject } from "@/lib/auth/request";

export async function GET(request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const a = await accessTo((await ctx.params).id, request.headers.get("cookie"));
  return a ? Response.json({ ...publicProject(a.project), role: a.role }) : Response.json({ error: "not found" }, { status: 404 });
}
