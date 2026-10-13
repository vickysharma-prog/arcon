import { z } from "zod";
import { accessTo, userOf } from "@/lib/auth/request";
import { money, sideOf } from "@/lib/project/fees";
import { nameOf, postEvent } from "@/lib/project/thread";
import { supabaseAdmin } from "@/lib/supabase/admin";

const cookie = (r: Request) => r.headers.get("cookie");

// The fee milestones on a project, and which side this person is on (the pro who bills, or the person who pays).
export async function GET(request: Request, ctx: RouteContext<"/api/projects/[id]/fees">) {
  const a = await accessTo((await ctx.params).id, cookie(request));
  if (!a || a.role === "viewer") return Response.json({ error: "not found" }, { status: 404 });
  const { data } = await supabaseAdmin().from("milestones").select("id, label, amount, currency, status, billed_at, claimed_at, received_at").eq("project_id", a.project.id).order("position");
  return Response.json({ milestones: (data ?? []).map((m) => ({ ...m, amount: Number(m.amount) })), side: sideOf(a.role, a.project.mode) });
}

const Add = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/).default("INR"),
  items: z
    .array(z.object({ label: z.string().trim().min(1).max(80), amount: z.number().min(0).max(1e12) }))
    .min(1)
    .max(12),
});

// The pro sets out their fees (one milestone or a whole split at once).
export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/fees">) {
  const a = await accessTo((await ctx.params).id, cookie(request));
  const me = await userOf(cookie(request));
  if (!a || !me) return Response.json({ error: "not found" }, { status: 404 });
  if (sideOf(a.role, a.project.mode) !== "pro") return Response.json({ error: "Only the pro on the project sets the fees." }, { status: 403 });
  const body = Add.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Add a name and an amount for each milestone." }, { status: 400 });
  const db = supabaseAdmin();
  const { count } = await db.from("milestones").select("id", { count: "exact", head: true }).eq("project_id", a.project.id);
  const rows = body.data.items.map((it, i) => ({ project_id: a.project.id, label: it.label, amount: it.amount, currency: body.data.currency, position: (count ?? 0) + i, created_by: me }));
  const { error } = await db.from("milestones").insert(rows);
  if (error) return Response.json({ error: "Couldn't save the fees." }, { status: 500 });
  const total = rows.reduce((s, r) => s + r.amount, 0);
  await postEvent(a.project, { id: me, name: await nameOf(me) }, { type: "fee", action: "added", label: rows.map((r) => r.label).join(", "), amount: money(total, body.data.currency) }).catch(() => {});
  return Response.json({ ok: true }, { status: 201 });
}
