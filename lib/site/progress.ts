// How a building site is doing: where each phase should be by today, the whole job's progress, what needs
// attention, and what it has cost so far. Pure, so the builder, the client and the tests read the same numbers.

export type PhaseRow = { id: number; key: string; name: string; start_date: string; end_date: string; status: "planned" | "active" | "done"; pct: number };
export type TaskRow = { id: number; title: string; due: string | null; status: "todo" | "doing" | "done"; phase_id: number | null };
export type MaterialRow = { id: number; name: string; unit: string; needed: number; ordered: number; delivered: number; used: number; unit_cost: number; phase: string | null };
export type Alert = { kind: "late" | "behind" | "overdue" | "stock" | "empty"; text: string };

const DAY = 86_400_000;
const at = (d: string) => new Date(`${d}T00:00:00Z`).getTime();
const days = (p: Pick<PhaseRow, "start_date" | "end_date">) => Math.max(1, (at(p.end_date) - at(p.start_date)) / DAY + 1);

/** Where a phase should be by `today`, 0 to 100, if work runs evenly between its dates. */
export function expectedPct(p: Pick<PhaseRow, "start_date" | "end_date">, today: string): number {
  const done = (at(today) - at(p.start_date)) / DAY + 1;
  return Math.round(Math.min(100, Math.max(0, (done / days(p)) * 100)));
}

/** The whole job's progress: each phase's % weighted by how long it runs. */
export function overallPct(phases: Pick<PhaseRow, "start_date" | "end_date" | "pct">[]): number {
  const total = phases.reduce((s, p) => s + days(p), 0);
  return total ? Math.round(phases.reduce((s, p) => s + days(p) * p.pct, 0) / total) : 0;
}

/** The phase work is in now: the first one not done. */
export const currentPhase = <T extends Pick<PhaseRow, "status">>(phases: T[]) => phases.find((p) => p.status !== "done") ?? null;

/** Stock on site, what's still to come, and what has never been ordered. */
export function stockOf(m: Pick<MaterialRow, "needed" | "ordered" | "delivered" | "used">) {
  return { onSite: Math.max(0, m.delivered - m.used), coming: Math.max(0, m.ordered - m.delivered), toOrder: Math.max(0, m.needed - m.ordered) };
}

/** Everything on site that needs someone's attention today. */
export function alertsFor(s: { phases: PhaseRow[]; tasks: TaskRow[]; materials: MaterialRow[]; onSiteToday: number; today: string }): Alert[] {
  const out: Alert[] = [];
  for (const p of s.phases) {
    if (p.status === "done") continue;
    if (at(p.end_date) < at(s.today)) out.push({ kind: "late", text: `${p.name} should have finished on ${p.end_date} (${p.pct}% done).` });
    else if (at(p.start_date) <= at(s.today) && expectedPct(p, s.today) - p.pct >= 20) out.push({ kind: "behind", text: `${p.name} is behind: ${p.pct}% done, ${expectedPct(p, s.today)}% expected by now.` });
  }
  const overdue = s.tasks.filter((t) => t.status !== "done" && t.due && at(t.due) < at(s.today));
  if (overdue.length) out.push({ kind: "overdue", text: `${overdue.length} task${overdue.length === 1 ? " is" : "s are"} overdue: ${overdue.slice(0, 3).map((t) => t.title).join(", ")}.` });
  // Stock runs low for the phase in progress: little left on site, nothing coming, and more still needed.
  const now = currentPhase(s.phases);
  for (const m of s.materials) {
    if (!now || m.phase !== now.key) continue;
    const st = stockOf(m);
    const left = m.needed - m.used;
    if (left > 0 && st.onSite + st.coming < Math.min(left, m.needed * 0.15)) out.push({ kind: "stock", text: `${m.name} is running low: ${st.onSite} ${m.unit} on site, ${left} still needed.` });
  }
  const weekday = new Date(at(s.today)).getUTCDay() % 6 !== 0;
  if (weekday && now && at(now.start_date) <= at(s.today) && s.onSiteToday === 0) out.push({ kind: "empty", text: "Nobody is marked on site today." });
  return out;
}

/** Labour so far: each day someone was on site, at their day rate (a day is 8 hours). */
export function labourCost(rows: { present: boolean; hours: number; day_rate: number }[]): number {
  return Math.round(rows.filter((r) => r.present).reduce((s, r) => s + (r.day_rate * r.hours) / 8, 0));
}

/** Who runs the site: the builder on it, or the pro who owns the project (a builder's own design-and-build job). */
export const runsSite = (role: string, mode: "owner" | "pro") => role === "builder" || (role === "owner" && mode === "pro");
