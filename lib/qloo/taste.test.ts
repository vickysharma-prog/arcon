import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfile, layerOf } from "./taste.ts";
import type { Entity } from "./api.ts";

// Synthetic entities only: Qloo response data stays out of the repo.
const tag = (id: string) => ({ tag_id: id });
const place: Entity = { entity_id: "p1", name: "A hotel", types: ["urn:entity:place"], tags: [tag("urn:tag:decor:qloo:vintage"), tag("urn:tag:ambience:qloo:moody")] };
const brand: Entity = { entity_id: "b1", name: "A brand", types: ["urn:entity:brand"], tags: [tag("urn:tag:aesthetic_property:qloo:clean_lines"), tag("urn:tag:decor:qloo:vintage")] };
const matched: Entity = {
  entity_id: "m1",
  name: "A matched brand",
  types: ["urn:entity:brand"],
  tags: [tag("urn:tag:aesthetic_property:qloo:natural_materials"), tag("urn:tag:industry:qloo:home_goods")],
  query: { affinity: 0.8, explainability: { "signal.interests.entities": [{ entity_id: "f1", score: 0.6 }] } },
};

test("layers come from entity types", () => {
  assert.equal(layerOf(place), 1);
  assert.equal(layerOf(brand), 2);
  assert.equal(layerOf({ entity_id: "f1", name: "A film", types: ["urn:entity:movie"] }), 3);
});

test("tags are weighted by layer and keep their evidence", () => {
  const p = buildProfile([{ entity: place, layer: 1 }, { entity: brand, layer: 2 }], [matched]);
  const vintage = p.tags.find((t) => t.value === "vintage")!;
  assert.equal(vintage.weight, 3 + 2); // a place counts 3, a brand 2
  assert.deepEqual(vintage.sources.map((s) => s.entityId), ["p1", "b1"]);
  assert.equal(p.tags[0].value, "vintage"); // strongest first
  assert.ok(Math.abs(p.tags.find((t) => t.value === "natural_materials")!.weight - 3) < 1e-9); // all layer-3 matches share one place's weight
  assert.ok(!p.tags.some((t) => t.value === "home_goods")); // industry tags are not style
  assert.deepEqual(p.brands[0].because, [{ entityId: "f1", score: 0.6 }]);
});
