import { accessTo, publicProject } from "@/lib/auth/request";
import { ownerName } from "@/lib/project/team";
import { unlockedFor } from "@/lib/project/unlock";
import { whoseName } from "@/lib/project/stage";

export async function GET(request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const a = await accessTo((await ctx.params).id, request.headers.get("cookie"));
  if (!a) return Response.json({ error: "not found" }, { status: 404 });
  const [unlocked, owner] = await Promise.all([unlockedFor(a.project), a.role === "owner" && !a.project.designed_for ? null : ownerName(a.project.owner_id)]);
  // Everyone else on the project sees whose design it is ("Vicky's design"); the owner sees "your".
  const whose = a.role === "owner" ? null : whoseName(a.project.designed_for, owner);
  return Response.json({ ...publicProject(a.project), role: a.role, unlocked, whose });
}
