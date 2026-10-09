import { test } from "node:test";
import assert from "node:assert/strict";
import { Layout } from "./schema.ts";
import { planOptions, place } from "./place.ts";
import { DEFAULT_SHELLS, TEMPLATES } from "./templates.ts";
import { validate } from "./validate.ts";

for (const [type, program] of Object.entries(TEMPLATES)) {
  test(`${type}: all three plan options are valid`, () => {
    const options = planOptions(program, DEFAULT_SHELLS[program.spaceType]);
    assert.equal(options.length, 3);
    for (const layout of options) {
      Layout.parse(layout);
      assert.deepEqual(validate(layout), []);
      const ids = layout.floors.flatMap((f) => f.spaces.map((s) => s.id));
      for (const r of program.rooms) assert.ok(ids.includes(r.id), `${r.id} is placed`);
    }
  });
}

test("rooms fill the shell with no gaps", () => {
  const layout = place(TEMPLATES.apartment, DEFAULT_SHELLS.apartment);
  const area = layout.floors[0].spaces.reduce((t, s) => t + s.rect.w * s.rect.h, 0);
  assert.ok(Math.abs(area - 12 * 8) < 1e-6);
});

test("the validator catches overlaps, unreachable rooms and missing windows", () => {
  const layout = structuredClone(place(TEMPLATES.apartment, DEFAULT_SHELLS.apartment));
  const floor = layout.floors[0];
  const bed = floor.spaces.find((s) => s.id === "primary")!;
  bed.rect.x += 1; // now overlaps its neighbour
  floor.openings = floor.openings.filter((o) => o.id !== "door-bed-2" && o.id !== "win-living");
  const errors = validate(layout).join("\n");
  assert.match(errors, /overlaps/);
  assert.match(errors, /bed-2 can't be reached/);
  assert.match(errors, /living has no window/);
});

test("a shell too shallow for two rows of rooms is refused", () => {
  assert.throws(() => place(TEMPLATES.apartment, { width: 12, depth: 5 }), /too shallow/);
});
