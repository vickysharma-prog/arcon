import { ownedProject, publicProject } from "@/lib/auth/request";
import { designProject } from "@/lib/design/run";
import { chatModel } from "@/lib/models";

// Brief + program + three plans: a few model calls, well inside the 300 s function limit.
export const maxDuration = 300;

export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/design">) {
  const p = await ownedProject((await ctx.params).id, request.headers.get("cookie"));
  if (!p) return Response.json({ error: "not found" }, { status: 404 });
  try {
    return Response.json(publicProject(await designProject(p.id, chatModel())));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "design failed" }, { status: 422 });
  }
}
