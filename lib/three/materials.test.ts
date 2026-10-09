import { test } from "node:test";
import assert from "node:assert/strict";
import { luminance, mix, scheme } from "./materials.ts";

const palette = [
  { hex: "#4a4a4a", role: "base" },
  { hex: "#b8860b", role: "metal" },
  { hex: "#8b4513", role: "wood" },
  { hex: "#2f5d45", role: "green" },
  { hex: "#e8e0d4", role: "textile" },
];

test("mixing and brightness behave", () => {
  assert.equal(mix("#000000", "#ffffff", 0.5), "#808080");
  assert.ok(luminance("#ffffff") > 0.99 && luminance("#000000") < 0.01);
});

test("the model takes its colours from the brief", () => {
  const s = scheme(palette);
  assert.equal(s.floor, "#8b4513");
  assert.equal(s.wood, "#8b4513");
  assert.equal(s.metal, "#b8860b");
  assert.equal(s.textile, "#e8e0d4");
  assert.equal(s.plant, "#2f5d45");
});

test("walls stay bright even with a dark palette", () => {
  const dark = scheme([{ hex: "#222222", role: "base" }, { hex: "#333333", role: "wood" }]);
  assert.ok(luminance(dark.wall) > 0.5, dark.wall);
});

test("no palette falls back to a neutral scheme", () => {
  assert.equal(scheme(undefined).wall, "#f2efe9");
});
