import { test } from "node:test";
import assert from "node:assert/strict";
import { doorClearance, furnish } from "./furniture.ts";
import { planOptions } from "../layout/place.ts";
import { buildingShell } from "../layout/footprint.ts";
import { DEFAULT_SHELLS, TEMPLATES } from "../layout/templates.ts";

const layouts = Object.values(TEMPLATES).flatMap((p) => planOptions(p, buildingShell(p, DEFAULT_SHELLS[p.spaceType])));

test("every piece sits inside its room", () => {
  for (const layout of layouts)
    for (const it of furnish(layout)) {
      const room = layout.floors[it.level].spaces.find((s) => s.id === it.room)!;
      const { x, y, w, h } = room.rect;
      assert.ok(it.x - it.w / 2 >= x - 1e-6 && it.x + it.w / 2 <= x + w + 1e-6, `${it.room}/${it.name} x`);
      assert.ok(it.z - it.d / 2 >= y - 1e-6 && it.z + it.d / 2 <= y + h + 1e-6, `${it.room}/${it.name} z`);
    }
});

test("nothing blocks the space in front of a door", () => {
  for (const layout of layouts)
    for (const it of furnish(layout)) {
      const f = layout.floors[it.level];
      const door = f.openings.find((o) => o.type === "door" && o.between[0] === it.room);
      if (!door) continue;
      const c = doorClearance(door, f.spaces.find((s) => s.id === it.room)!);
      const clear = Math.abs(it.x - c.x) * 2 >= it.w + c.w - 1e-9 || Math.abs(it.z - c.z) * 2 >= it.d + c.d - 1e-9;
      assert.ok(clear, `${it.room}/${it.name} blocks its door`);
    }
});

test("every room gets a plant", () => {
  for (const layout of layouts)
    for (const f of layout.floors)
      for (const room of f.spaces.filter((s) => s.zone !== "circulation")) {
        const has = furnish(layout).some((it) => it.room === room.id && it.level === f.level && it.role === "plant");
        // A plant may be dropped only when the room is too small to keep it clear of the door.
        if (room.rect.w * room.rect.h >= 6) assert.ok(has, `${layout.spaceType}/${room.id} has a plant`);
      }
});

const house = planOptions(TEMPLATES.house, buildingShell(TEMPLATES.house, DEFAULT_SHELLS.house))[0];

test("bedrooms get a bed and kitchens a full kitchen run", () => {
  const items = furnish(house);
  assert.ok(items.some((i) => i.room === "primary" && i.name === "bed"));
  assert.ok(items.some((i) => i.room === "kitchen" && i.name === "kitchen run"));
});

test("a piece's footprint is its own size, turned", () => {
  for (const layout of layouts)
    for (const it of furnish(layout)) {
      const across = Math.abs(Math.sin(it.rot)) > 0.5;
      assert.ok(Math.abs((across ? it.ld : it.lw) - it.w) < 1e-9 && Math.abs((across ? it.lw : it.ld) - it.d) < 1e-9, `${it.room}/${it.name}`);
    }
});

test("a kitchen too tight for an island gets a small table instead", () => {
  const items = furnish(house).filter((i) => i.room === "kitchen");
  assert.ok(items.some((i) => i.name === "island" || i.name === "cafe table"));
});

test("the sofa faces the TV, and pieces face into their room", () => {
  const items = furnish(house).filter((i) => i.room === "living");
  const sofa = items.find((i) => i.name === "sofa")!;
  const tv = items.find((i) => i.name === "media unit")!;
  assert.ok(Math.cos(sofa.rot - tv.rot) < -0.99, "they look at each other");
  // From the sofa, its front points toward the TV.
  assert.ok(Math.sin(sofa.rot) * (tv.x - sofa.x) + Math.cos(sofa.rot) * (tv.z - sofa.z) > 0);
});

test("a green-leaning taste gets more plants", () => {
  const count = (lush: boolean) => furnish(house, { lush }).filter((i) => i.name === "plant").length;
  assert.ok(count(true) > count(false));
});
