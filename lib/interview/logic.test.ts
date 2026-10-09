import { test } from "node:test";
import assert from "node:assert/strict";
import { missingForDesign, profileSummary, siteSizeProblem, toCandidate, toMetres } from "./logic.ts";
import type { Project } from "../project/store.ts";
import type { Profile } from "../qloo/taste.ts";

const project = (over: Partial<Project> = {}): Project => ({
  id: "p", owner_id: null, guest_id: null, mode: "owner", space_type: null, title: null, status: "interview",
  site: {}, interview: {}, taste_signals: [], taste: null, brief: null, program: null, chosen_option: null, ...over,
});

test("feet convert to metres", () => {
  assert.equal(toMetres(10, "m"), 10);
  assert.ok(Math.abs(toMetres(40, "ft") - 12.192) < 1e-9);
});

test("candidates describe the match in plain words", () => {
  const c = toCandidate({ entity_id: "e", name: "A hotel", types: ["urn:entity:place"], properties: { address: "1 Main St, Austin" } });
  assert.deepEqual(c, { entityId: "e", name: "A hotel", kind: "place", detail: "1 Main St, Austin", layer: 1 });
  assert.equal(toCandidate({ entity_id: "f", name: "A film", types: ["urn:entity:movie"] }).kind, "film");
  assert.equal(toCandidate({ entity_id: "x", name: "?", types: [] }).kind, "other");
});

test("a fresh project is missing everything", () => {
  assert.equal(missingForDesign(project()).length, 5);
});

test("a complete project is ready", () => {
  const ready = project({
    space_type: "house",
    site: { width: 14, depth: 10, location: "Austin, TX" },
    taste_signals: [
      { entityId: "a", name: "A", layer: 1 },
      { entityId: "b", name: "B", layer: 3 },
      { entityId: "c", name: "C", layer: 3 },
    ],
  });
  assert.deepEqual(missingForDesign(ready), []);
});

test("culture alone is not enough taste", () => {
  const onlyFilms = project({
    space_type: "house",
    site: { width: 14, depth: 10, location: "Austin" },
    taste_signals: ["a", "b", "c"].map((id) => ({ entityId: id, name: id, layer: 3 as const })),
  });
  assert.deepEqual(missingForDesign(onlyFilms), ["at least one place or brand they love"]);
});

test("the summary keeps the strongest words and their sources", () => {
  const profile: Profile = {
    tags: [
      { family: "decor", value: "post_industrial", weight: 3, sources: [{ entityId: "a", name: "A hotel", layer: 1 }] },
      { family: "ambience", value: "moody", weight: 2, sources: [{ entityId: "a", name: "A hotel", layer: 1 }] },
    ],
    brands: [{ id: "b", name: "A brand", affinity: 0.9, aesthetic: ["clean_lines", "natural_materials"], because: [] }],
  };
  const s = profileSummary(profile, 1);
  assert.deepEqual(s.style, [{ word: "post industrial", from: ["A hotel"] }]);
  assert.deepEqual(s.brands, [{ name: "A brand", look: ["clean lines", "natural materials"] }]);
});

test("site sizes outside a studio-to-hotel range are refused", () => {
  assert.equal(siteSizeProblem(8, 6, "m"), null); // small studio
  assert.equal(siteSizeProblem(40, 60, "ft"), null); // typical US lot
  assert.equal(siteSizeProblem(undefined, undefined, "ft"), null);
  assert.match(siteSizeProblem(10000, 60, "ft")!, /width of 10000 ft/);
  assert.match(siteSizeProblem(40, 3, "m")!, /depth of 3 m/);
  assert.match(siteSizeProblem(15, 15, "ft")!, /width of 15 ft/); // 4.6 m is too small for any room pair
});
