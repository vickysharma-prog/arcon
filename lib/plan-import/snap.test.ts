import { test } from "node:test";
import assert from "node:assert/strict";
import { snapPlan, type ReadPlan } from "./snap.ts";
import { CONCEPT_IDS, placeConcept } from "../layout/concepts.ts";
import { buildingShell } from "../layout/footprint.ts";
import { DEFAULT_SHELLS, TEMPLATES } from "../layout/templates.ts";
import type { Layout } from "../layout/schema.ts";

// What a model might read off a drawing of one of our own plans: every room but the halls, each edge off by
// up to 15 cm. Snapping it back must give a valid plan with the same rooms at nearly the same size.
function asRead(l: Layout, seed = 1): ReadPlan {
  let s = seed;
  const jitter = () => ((s = (s * 9301 + 49297) % 233280), (s / 233280 - 0.5) * 0.3);
  return {
    spaceType: l.spaceType,
    width: l.shell.width,
    depth: l.shell.depth,
    rooms: l.floors.flatMap((f) =>
      f.spaces
        .filter((sp) => sp.kind !== "corridor")
        .map((sp) => ({ name: sp.name, kind: sp.kind, floor: f.level, x: sp.rect.x + jitter(), y: sp.rect.y + jitter(), w: sp.rect.w + jitter(), h: sp.rect.h + jitter() })),
    ),
  };
}

for (const type of ["house", "apartment", "office", "cafe"] as const)
  test(`${type}: a noisy reading of our own plans snaps back to a valid plan with the same rooms`, () => {
    const program = TEMPLATES[type];
    for (const c of CONCEPT_IDS) {
      const original = placeConcept(program, buildingShell(program, DEFAULT_SHELLS[program.spaceType]), c);
      if (!original) continue;
      const { layout, problems } = snapPlan(asRead(original, c.length));
      assert.deepEqual(problems, [], `${type}/${c}`);
      for (const f of original.floors)
        for (const sp of f.spaces.filter((x) => x.zone !== "circulation")) {
          const got = layout.floors[f.level].spaces.find((x) => x.name === sp.name)!;
          assert.ok(got, `${sp.name} kept`);
          const ratio = (got.rect.w * got.rect.h) / (sp.rect.w * sp.rect.h);
          assert.ok(ratio > 0.85 && ratio < 1.15, `${sp.name} area ${ratio.toFixed(2)}x`);
        }
    }
  });

test("a gap the drawing left between rooms becomes a hall that every room opens onto", () => {
  const read: ReadPlan = {
    spaceType: "apartment", width: 10, depth: 8,
    rooms: [
      { name: "Living room", kind: "living", floor: 0, x: 0, y: 0, w: 6, h: 3.4 },
      { name: "Kitchen", kind: "kitchen", floor: 0, x: 6, y: 0, w: 4, h: 3.4 },
      { name: "Bedroom", kind: "bedroom", floor: 0, x: 0, y: 4.6, w: 5, h: 3.4 },
      { name: "Bath", kind: "bath", floor: 0, x: 5, y: 4.6, w: 2, h: 3.4 },
      { name: "Bedroom 2", kind: "bedroom", floor: 0, x: 7, y: 4.6, w: 3, h: 3.4 },
    ],
  };
  const { layout, problems } = snapPlan(read);
  assert.deepEqual(problems, []);
  const hall = layout.floors[0].spaces.find((s) => s.kind === "corridor")!;
  assert.deepEqual(hall.rect, { x: 0, y: 3.4, w: 10, h: 1.2 });
  for (const id of ["bedroom", "bath", "bedroom-2"]) {
    const door = layout.floors[0].openings.find((o) => o.type === "door" && o.between[0] === id)!;
    assert.equal(door.between[1], "hall", `${id} opens onto the hall`);
  }
  const entry = layout.floors[0].openings.find((o) => o.id === "door-entry")!;
  assert.ok(entry, "has a front door");
});

test("rooms that don't fit together are reported, not hidden", () => {
  const read: ReadPlan = {
    spaceType: "house", width: 10, depth: 8,
    rooms: [
      { name: "Living room", kind: "living", floor: 0, x: 0, y: 0, w: 6, h: 8 },
      { name: "Bedroom", kind: "bedroom", floor: 0, x: 4, y: 0, w: 6, h: 8 },
    ],
  };
  const { problems } = snapPlan(read);
  assert.ok(problems.some((p) => /overlaps/.test(p)));
});

test("odd readings never crash: unknown kinds, tiny scraps, rooms off the edge, duplicate names", () => {
  const read: ReadPlan = {
    spaceType: "house", width: 9, depth: 7,
    rooms: [
      { name: "Den", kind: "den", floor: 0, x: -1, y: -0.5, w: 5, h: 4 },
      { name: "Den", kind: "living", floor: 0, x: 4, y: 0, w: 6, h: 4 },
      { name: "Scrap", kind: "bath", floor: 0, x: 3, y: 5, w: 0.2, h: 0.2 },
    ],
  };
  const { layout } = snapPlan(read);
  const ids = layout.floors[0].spaces.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "unique ids");
  assert.ok(layout.floors[0].spaces.every((s) => s.rect.x >= 0 && s.rect.x + s.rect.w <= 9 + 1e-9));
  assert.ok(!ids.includes("scrap"));
});
