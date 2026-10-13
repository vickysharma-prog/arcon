import { accessTo, publicProject } from "@/lib/auth/request";
import { designProject } from "@/lib/design/run";
import { chatModel } from "@/lib/models";

// Brief + program + three plans: a few model calls, well inside the 300 s function limit.
export const maxDuration = 300;

// Editors can design or redesign. A client may start the first design of their own answers (a pro's project),
// but never redo one that exists.
export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/design">) {
  const a = await accessTo((await ctx.params).id, request.headers.get("cookie"));
  const first = a && a.role === "client" && !a.project.brief && a.project.status === "designing";
  if (!a || !(first || ["owner", "architect"].includes(a.role))) return Response.json({ error: "not found" }, { status: 404 });
  try {
    return Response.json(publicProject(await designProject(a.project.id, chatModel())));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "design failed" }, { status: 422 });
  }
}
