import { ownedProject, publicProject } from "@/lib/auth/request";

export async function GET(request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const p = await ownedProject((await ctx.params).id, request.headers.get("cookie"));
  return p ? Response.json(publicProject(p)) : Response.json({ error: "not found" }, { status: 404 });
}
