import { z } from "zod";
import { ownedProject, publicProject } from "@/lib/auth/request";
import { latestVersion, listVersions, saveVersion, undoVersion, updateProject } from "@/lib/project/store";
import { applyChange, describe, type Change } from "@/lib/workspace/edit";
import { suggestions, understand } from "@/lib/workspace/understand";
import { ask } from "@/lib/workspace/ask";
import { chatModel } from "@/lib/models";

// One change to the chosen plan: a change the workspace built, words someone typed, or undo. The server always
// works the plan out again itself from the change, so the browser's preview is never trusted as the result.
export const maxDuration = 60;

const ChangeSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("resize"), room: z.string().min(1), by: z.number().min(0.3).max(3) }),
  z.object({ op: z.literal("add"), kind: z.string().min(1).max(30), name: z.string().min(1).max(40) }),
  z.object({ op: z.literal("remove"), room: z.string().min(1) }),
  z.object({ op: z.literal("rename"), room: z.string().min(1), name: z.string().min(1).max(40) }),
  z.object({ op: z.literal("kitchen"), open: z.boolean() }),
]);
const Body = z.union([z.object({ change: ChangeSchema }), z.object({ text: z.string().min(1).max(300) }), z.object({ undo: z.literal(true) })]);

export async function GET(request: Request, ctx: RouteContext<"/api/projects/[id]/edit">) {
  const p = await ownedProject((await ctx.params).id, request.headers.get("cookie"));
  if (!p) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ versions: await listVersions(p.id) });
}

export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/edit">) {
  const p = await ownedProject((await ctx.params).id, request.headers.get("cookie"), "edit");
  if (!p) return Response.json({ error: "not found" }, { status: 404 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "That change wasn't understood." }, { status: 400 });
  const chosen = p.chosen_option;
  const current = chosen === null ? undefined : p.options?.[chosen];
  if (chosen === null || !current) return Response.json({ error: "Choose a plan first." }, { status: 400 });
  const save = async (layout: typeof current) => {
    const options = [...(p.options ?? [])];
    options[chosen] = layout;
    return publicProject(await updateProject(p.id, { options }));
  };

  if ("undo" in body.data) {
    const prev = await undoVersion(p.id);
    if (!prev) return Response.json({ error: "There's nothing to undo." }, { status: 400 });
    return Response.json({ project: await save(prev.layout), note: "Undid the last change" });
  }

  let change: Change;
  if ("change" in body.data) change = body.data.change;
  else {
    const read = understand(body.data.text, current);
    if (read) change = read;
    else {
      // The plain rules couldn't read it: one model call, mapped to the same changes.
      try {
        // A full model first: the lite ones are slower here. Others stand in when one is busy or out of quota.
        const asked = await ask(body.data.text, current, chatModel(process.env, { tools: true }));
        if ("none" in asked) return Response.json({ error: asked.none, suggestions: suggestions(current) }, { status: 422 });
        change = asked;
      } catch {
        return Response.json({ error: "I couldn't read that one. Try one of these.", suggestions: suggestions(current) }, { status: 422 });
      }
    }
  }

  const out = applyChange(current, change);
  if ("error" in out) return Response.json({ error: out.error, change }, { status: 422 });
  // The plan as chosen is the first version, so the first change can always be undone.
  if (!(await latestVersion(p.id))) await saveVersion(p.id, current, "Chose this plan");
  const note = describe(change, current);
  await saveVersion(p.id, out.layout, note);
  return Response.json({ project: await save(out.layout), note, change });
}
