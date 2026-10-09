import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSlabs, buildWalls, DOOR_H, EYE, SILL, STOREY, walkPath, WALL_H } from "./geometry.ts";
import { place } from "../layout/place.ts";
import { DEFAULT_SHELLS, TEMPLATES } from "../layout/templates.ts";
import type { Layout } from "../layout/schema.ts";

// Two rooms side by side, a door between them and a window in the left one.
const tiny: Layout = {
  spaceType: "studio",
  shell: { width: 8, depth: 4 },
  floors: [
    {
      level: 0,
      spaces: [
        { id: "a", name: "A", kind: "living", zone: "public", rect: { x: 0, y: 0, w: 4, h: 4 } },
        { id: "b", name: "B", kind: "bedroom", zone: "private", rect: { x: 4, y: 0, w: 4, h: 4 } },
      ],
      openings: [
        { id: "door-ab", type: "door", between: ["a", "b"], x: 4, y: 2, axis: "y", width: 0.9 },
        { id: "win-a", type: "window", between: ["a", "outside"], x: 2, y: 0, axis: "x", width: 1.2 },
      ],
    },
  ],
};

test("a wall shared by two rooms is built once", () => {
  const { walls } = buildWalls(tiny);
  const shared = walls.filter((w) => w.axis === "z" && w.at === 4);
  // Split by the door: below it, above it, and the lintel over the opening.
  assert.equal(shared.length, 3);
  assert.ok(shared.every((w) => !w.exterior && w.thick === 0.1));
});

test("a door leaves a full-height gap up to the lintel", () => {
  const { walls } = buildWalls(tiny);
  const lintel = walls.find((w) => w.axis === "z" && w.at === 4 && w.y0 === DOOR_H)!;
  assert.ok(Math.abs(lintel.from - 1.55) < 1e-9 && Math.abs(lintel.to - 2.45) < 1e-9);
  assert.equal(lintel.y1, WALL_H);
  assert.ok(!walls.some((w) => w.axis === "z" && w.at === 4 && w.y0 === 0 && w.from < 2.4 && w.to > 1.6), "nothing fills the doorway");
});

test("a window has a sill, glass and a lintel in an exterior wall", () => {
  const { walls, glass } = buildWalls(tiny);
  const front = walls.filter((w) => w.axis === "x" && w.at === 0);
  assert.ok(front.every((w) => w.exterior && w.thick === 0.2));
  assert.ok(front.some((w) => w.y0 === 0 && w.y1 === SILL && Math.abs(w.from - 1.4) < 1e-9));
  assert.deepEqual(glass.map((g) => [g.from, g.to, g.y0, g.y1]), [[1.4, 2.6, SILL, DOOR_H]]);
});

test("every room gets a floor slab at its storey", () => {
  const layout = place(TEMPLATES.house, DEFAULT_SHELLS.house);
  const slabs = buildSlabs(layout);
  assert.equal(slabs.length, layout.floors.reduce((t, f) => t + f.spaces.length, 0));
  assert.ok(slabs.filter((s) => s.level === 1).every((s) => s.y === STOREY));
});

test("the walk starts outside, enters by the front door and visits every room", () => {
  const layout = place(TEMPLATES.house, DEFAULT_SHELLS.house);
  const path = walkPath(layout);
  const entry = layout.floors[0].openings.find((o) => o.id === "door-entry")!;
  assert.ok(path[0][0] < 0 || path[0][2] < 0 || path[0][0] > layout.shell.width || path[0][2] > layout.shell.depth, "starts outside");
  assert.deepEqual([path[1][0], path[1][2]], [entry.x, entry.y]);
  for (const f of layout.floors)
    for (const s of f.spaces.filter((s) => s.zone !== "circulation")) {
      const { x, y, w, h } = s.rect;
      const inRoom = (p: number[]) => p[0] > x + 0.2 && p[0] < x + w - 0.2 && p[2] > y + 0.2 && p[2] < y + h - 0.2 && Math.abs(p[1] - (f.level * STOREY + EYE)) < 1e-9;
      assert.ok(path.some(inRoom), `steps into ${s.id}`);
    }
  assert.ok(path.every((p) => p[1] === EYE || p[1] === STOREY + EYE), "always at eye height");
});

test("the walk never passes through a wall", () => {
  // Consecutive points either stay in one space or cross at a door.
  const layout = place(TEMPLATES.apartment, DEFAULT_SHELLS.apartment);
  const path = walkPath(layout);
  const f = layout.floors[0];
  const where = (x: number, z: number) => f.spaces.find((s) => x >= s.rect.x - 1e-6 && x <= s.rect.x + s.rect.w + 1e-6 && z >= s.rect.y - 1e-6 && z <= s.rect.y + s.rect.h + 1e-6);
  const doors = f.openings.filter((o) => o.type === "door").map((o) => [o.x, o.y]);
  for (let i = 1; i < path.length; i++) {
    const [ax, , az] = path[i - 1];
    const [bx, , bz] = path[i];
    const onDoor = (x: number, z: number) => doors.some(([dx, dz]) => Math.abs(dx - x) < 1e-9 && Math.abs(dz - z) < 1e-9);
    if (onDoor(ax, az) || onDoor(bx, bz) || !where(ax, az) || !where(bx, bz)) continue;
    assert.equal(where(ax, az)?.id, where(bx, bz)?.id, `step ${i} crosses from ${where(ax, az)?.id} to ${where(bx, bz)?.id}`);
  }
});
