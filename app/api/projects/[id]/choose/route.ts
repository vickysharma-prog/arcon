import { z } from "zod";
import { ownedProject, publicProject } from "@/lib/auth/request";
import { chooseOption } from "@/lib/design/run";

const Body = z.object({ option: z.number().int().min(0).max(2) });

export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/choose">) {
  const p = await ownedProject((await ctx.params).id, request.headers.get("cookie"));
  if (!p) return Response.json({ error: "not found" }, { status: 404 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "option must be 0, 1 or 2" }, { status: 400 });
  try {
    return Response.json(publicProject(await chooseOption(p.id, body.data.option)));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "could not choose" }, { status: 422 });
  }
}
