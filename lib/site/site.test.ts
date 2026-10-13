import { test } from "node:test";
import assert from "node:assert/strict";
import { dayIn, seedMaterials, seedPhases } from "./plan.ts";
import { alertsFor, currentPhase, expectedPct, labourCost, overallPct, stockOf, type PhaseRow } from "./progress.ts";
import { timeline } from "../budget/timeline.ts";
import { estimate, marketOf } from "../budget/costs.ts";
import { placeConcept } from "../layout/concepts.ts";
import { TEMPLATES, DEFAULT_SHELLS } from "../layout/templates.ts";
import { buildingShell } from "../layout/footprint.ts";

const program = TEMPLATES.house;
const house = placeConcept(program, buildingShell(program, DEFAULT_SHELLS.house), "hall-street")!;

test("site phases follow the design's timeline, start on the chosen day and skip design", () => {
  const phases = seedPhases(timeline(house, "mid", false), new Date("2026-11-02T00:00:00Z"));
  assert.ok(!phases.some((p) => p.key === "design"));
  assert.equal(phases[0].start, "2026-11-02");
  assert.ok(phases.every((p) => p.end >= p.start));
  assert.deepEqual(phases.map((p) => p.position), phases.map((_, i) => i));
  assert.equal(phases.at(-1)!.key, "handover");
});

test("materials are taken off the plan, with costs from the budget", () => {
  const est = estimate(house, "mid", marketOf("Pune, India"), false, "Pune, India");
  const m = seedMaterials(house, est, false);
  const floor = m.find((x) => x.name === "Flooring")!;
  assert.ok(floor.needed > 50 && floor.unitCost > 0, JSON.stringify(floor));
  assert.ok(m.some((x) => x.name === "Kitchen units" && x.needed === 1));
  assert.ok(!m.some((x) => x.name === "Cement")); // a fit-out has no structure
  const built = seedMaterials(house, estimate(house, "mid", marketOf("Pune, India"), true, "Pune, India"), true);
  assert.ok(built.some((x) => x.name === "Cement" && x.phase === "structure"));
});

const phase = (o: Partial<PhaseRow>): PhaseRow => ({ id: 1, key: "finishes", name: "Floors, walls and ceilings", start_date: "2026-11-01", end_date: "2026-11-10", status: "active", pct: 0, ...o });

test("expected progress runs evenly between a phase's dates; overall weights by length", () => {
  assert.equal(expectedPct(phase({}), "2026-10-30"), 0);
  assert.equal(expectedPct(phase({}), "2026-11-05"), 50);
  assert.equal(expectedPct(phase({}), "2026-12-01"), 100);
  assert.equal(overallPct([phase({ pct: 100 }), phase({ pct: 0, start_date: "2026-11-11", end_date: "2026-11-30" })]), 33);
  assert.equal(currentPhase([phase({ status: "done" }), phase({ id: 2 })])!.id, 2);
});

test("alerts: late and behind phases, overdue tasks, low stock for the phase in hand, nobody on site", () => {
  const a = alertsFor({
    phases: [phase({ id: 1, key: "services", name: "Electrical and plumbing", start_date: "2026-10-20", end_date: "2026-10-31", pct: 70 }), phase({ id: 2, pct: 10 })],
    tasks: [{ id: 1, title: "Lay tiles", due: "2026-11-03", status: "todo", phase_id: 2 }],
    materials: [{ id: 1, name: "Electrical points", unit: "points", needed: 60, ordered: 40, delivered: 40, used: 38, unit_cost: 0, phase: "services" }],
    onSiteToday: 0,
    today: "2026-11-06", // a Friday
  });
  const kinds = a.map((x) => x.kind);
  assert.deepEqual(kinds, ["late", "behind", "overdue", "stock", "empty"]);
  assert.match(a[3].text, /2 points on site, 22 still needed/);
});

test("a calm site has no alerts; weekends don't count for attendance", () => {
  const a = alertsFor({ phases: [phase({ pct: 60 })], tasks: [], materials: [], onSiteToday: 0, today: "2026-11-07" }); // Saturday
  assert.deepEqual(a, []);
});

test("stock and labour add up", () => {
  assert.deepEqual(stockOf({ needed: 100, ordered: 70, delivered: 50, used: 20 }), { onSite: 30, coming: 20, toOrder: 30 });
  assert.equal(labourCost([{ present: true, hours: 8, day_rate: 1000 }, { present: true, hours: 4, day_rate: 1000 }, { present: false, hours: 8, day_rate: 1000 }]), 1500);
});

test("today is the person's own day, not the server's", () => {
  const late = new Date("2026-10-13T22:16:00Z"); // 3:46am on the 14th in India
  assert.equal(dayIn("Asia/Kolkata", late), "2026-10-14");
  assert.equal(dayIn("America/New_York", late), "2026-10-13");
  assert.equal(dayIn(undefined, late), "2026-10-13");
  assert.equal(dayIn("Not/AZone", late), "2026-10-13");
});
