import { supabaseAdmin } from "../supabase/admin.ts";
import type { Layout } from "../layout/schema.ts";
import { sketchOf, type Sketch } from "./sketch.ts";
import { waitsFor, type Wait, type WaitInput } from "./waiting.ts";
import { unreadCount } from "../project/thread.ts";
import { sitesToday } from "../site/store.ts";
import { money, sideOf } from "../project/fees.ts";
import { estimate, marketOf, money as cost } from "../budget/costs.ts";
import { timeline } from "../budget/timeline.ts";

// Everything the home page shows beyond the project list, fetched together: a drawing of each design, unread
// messages, review answers, fees, sites, and what's waiting on this person.

export type BoardProject = {
  id: string;
  name: string;
  role: WaitInput["role"];
  mode: string;
  status: string;
  chosen_option: number | null;
  space_type: string | null;
  site: { location?: string; opening?: string } | null;
};

export type Board = {
  sketches: Record<string, Sketch | null>;
  unread: Record<string, number>;
  sites: Awaited<ReturnType<typeof sitesToday>>;
  waits: Wait[];
  money: { billed: string | null; received: string | null };
  /** for the project in focus: the estimate and when it opens or is finished */
  focus: { estimate: string | null; opening: string | null; openingSet: boolean; layout: Layout | null } | null;
};

const db = () => supabaseAdmin();

/** `light` leaves out the drawings and the project in focus, for the sidebar on every page. */
export async function boardFor(userId: string, projects: BoardProject[], day?: string, today = new Date(), light = false): Promise<Board> {
  const ids = projects.slice(0, 40).map((p) => p.id);
  if (!ids.length) return { sketches: {}, unread: {}, sites: [], waits: [], money: { billed: null, received: null }, focus: null };

  const [versions, approvals, fees, clients, sites, snags, unreadList] = await Promise.all([
    // the light board needs only the version numbers (for changes waiting), not the plans
    db().from("project_versions").select(light ? "project_id, version" : "project_id, version, layout").in("project_id", ids).order("version", { ascending: false }),
    db().from("approvals").select("project_id, decision, version, created_at").in("project_id", ids).order("created_at", { ascending: false }),
    db().from("milestones").select("project_id, label, amount, currency, status, created_by").in("project_id", ids).order("position"),
    db().from("project_members").select("project_id, role").in("project_id", ids).in("role", ["client", "builder"]),
    sitesToday(projects.filter((p) => p.status === "building").map((p) => p.id), day),
    db().from("snags").select("project_id, status").in("project_id", ids).neq("status", "closed"),
    Promise.all(ids.slice(0, 20).map(async (id) => [id, await unreadCount(id, userId).catch(() => 0)] as const)),
  ]);

  // the latest saved version of each design, or else the chosen plan
  const layouts = new Map<string, Layout>();
  const latestV = new Map<string, number>();
  for (const v of (versions.data ?? []) as unknown as { project_id: string; version: number; layout?: Layout }[]) {
    if (!latestV.has(v.project_id)) latestV.set(v.project_id, v.version);
    if (v.layout && !layouts.has(v.project_id)) layouts.set(v.project_id, v.layout);
  }
  const missing = light ? [] : projects.filter((p) => !layouts.has(p.id) && p.chosen_option !== null).map((p) => p.id);
  if (missing.length) {
    const { data } = await db().from("projects").select("id, options, chosen_option").in("id", missing);
    for (const p of (data ?? []) as { id: string; options: Layout[] | null; chosen_option: number | null }[]) {
      const l = p.chosen_option !== null ? p.options?.[p.chosen_option] : null;
      if (l) layouts.set(p.id, l);
    }
  }

  const approvedV = new Map<string, number>();
  for (const a of (approvals.data ?? []) as { project_id: string; decision: string; version: number }[]) if (a.decision === "approved" && !approvedV.has(a.project_id)) approvedV.set(a.project_id, a.version);
  const lastAnswer = new Map<string, string>();
  for (const a of (approvals.data ?? []) as { project_id: string; decision: string }[]) if (!lastAnswer.has(a.project_id)) lastAnswer.set(a.project_id, a.decision);
  const snagRows = (snags.data ?? []) as { project_id: string; status: string }[];
  const members = (clients.data ?? []) as { project_id: string; role: string }[];
  const withClient = new Set(members.filter((m) => m.role === "client").map((c) => c.project_id));
  const withBuilder = new Set(members.filter((m) => m.role === "builder").map((c) => c.project_id));
  const unread = Object.fromEntries(unreadList);
  // A pro's fees are their own milestones (another pro on the project bills separately); a payer sees all they owe.
  const sideIn = new Map(projects.map((p) => [p.id, sideOf(p.role, p.mode as "owner" | "pro")]));
  const feeRows = ((fees.data ?? []) as { project_id: string; label: string; amount: number; currency: string; status: string; created_by: string }[]).filter(
    (f) => sideIn.get(f.project_id) !== "pro" || f.created_by === userId,
  );

  const waits = waitsFor(
    projects.slice(0, 40).map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      mode: p.mode,
      status: p.status,
      chosen: p.chosen_option !== null,
      decides: p.role === "client" || (p.role === "owner" && !withClient.has(p.id)),
      changesAsked: lastAnswer.get(p.id) === "changes",
      handoverReady: p.status === "building" && (sites.find((s) => s.id === p.id)?.overall ?? 0) >= 100,
      // who fixes snags: the builder, or a pro who owns it with no builder, or an owner building it themselves
      snagsToFix: (p.role === "builder" || (p.role === "owner" && p.mode === "pro" && !withBuilder.has(p.id))) ? snagRows.filter((s) => s.project_id === p.id && s.status === "open").length : 0,
      snagsToCheck: snagRows.filter((s) => s.project_id === p.id && s.status === "fixed").length,
      changePending: (p.status === "approved" || p.status === "building") && approvedV.has(p.id) && (latestV.get(p.id) ?? 0) > approvedV.get(p.id)!,
      unread: unread[p.id] ?? 0,
      late: sites.find((s) => s.id === p.id)?.late ?? 0,
      fees: feeRows.filter((f) => f.project_id === p.id).map((f) => ({ label: f.label, status: f.status, amount: money(Number(f.amount), f.currency) })),
    })),
  );

  // fees across projects, in the first project's currency (pros usually work in one)
  const cur = feeRows[0]?.currency;
  const sum = (s: string[]) => feeRows.filter((f) => f.currency === cur && s.includes(f.status)).reduce((n, f) => n + Number(f.amount), 0);
  const moneyLine = cur ? { billed: money(sum(["billed", "claimed"]), cur), received: money(sum(["received"]), cur) } : { billed: null, received: null };

  // the project in focus is the most recent one
  const first = projects[0];
  const layout = layouts.get(first.id) ?? null;
  let focus: Board["focus"] = null;
  if (first && !light) {
    const market = marketOf(first.site?.location);
    const est = layout ? estimate(layout, "mid", market, false, first.site?.location) : null;
    const weeks = layout ? timeline(layout, "mid").weeks : null;
    const opening = first.site?.opening ?? (weeks ? new Date(today.getTime() + weeks * 7 * 86_400_000).toISOString().slice(0, 10) : null);
    focus = { estimate: est ? `${cost(est.total.low, market)}–${cost(est.total.high, market)}` : null, opening, openingSet: !!first.site?.opening, layout };
  }

  return {
    sketches: Object.fromEntries(projects.map((p) => [p.id, sketchOf(layouts.get(p.id))])),
    unread,
    sites,
    waits,
    money: moneyLine,
    focus,
  };
}
