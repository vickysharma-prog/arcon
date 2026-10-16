import { z } from "zod";
import { accessTo, userOf } from "@/lib/auth/request";
import { canSendForReview } from "@/lib/project/review";
import { actorOf } from "@/lib/project/actor";
import { decide, decides, inPersonClient, nameOf, sendForReview } from "@/lib/project/thread";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("send") }),
  z.object({ action: z.enum(["approve", "changes"]), note: z.string().trim().max(2000).optional() }),
]);

// Review, inside the thread: the architect (or the owner) sends the design; a client approves it or asks for changes.
export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/review">) {
  const id = (await ctx.params).id;
  const cookie = request.headers.get("cookie");
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "That wasn't understood." }, { status: 400 });

  if (body.data.action === "send") {
    const a = await accessTo(id, cookie, "review");
    if (!a) return Response.json({ error: "not found" }, { status: 404 });
    if (!canSendForReview(a.project)) return Response.json({ error: "Choose a plan first, or wait for the current review." }, { status: 409 });
    const version = await sendForReview(a.project, await actorOf(cookie));
    return Response.json({ status: "review", version });
  }

  const a = await accessTo(id, cookie, "approve");
  if (!a) return Response.json({ error: "not found" }, { status: 404 });
  const me = await userOf(cookie);
  if (!me) return Response.json({ error: "Sign in to approve, so it's on record who did." }, { status: 401 });
  if (a.project.status !== "review") return Response.json({ error: "There's nothing waiting for review." }, { status: 409 });
  if (!(await decides(a.project, a.role))) return Response.json({ error: "Your client approves this one." }, { status: 403 });
  const decision = body.data.action === "approve" ? "approved" : "changes";
  const version = await decide(a.project, { id: me, name: await nameOf(me) }, decision, body.data.note || null, await inPersonClient(a.project, a.role));
  return Response.json({ status: decision === "approved" ? "approved" : "ready", version });
}
