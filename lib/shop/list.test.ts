import { test } from "node:test";
import assert from "node:assert/strict";
import { alternatives, brandFor, piecesOf, priceEach, type BrandInfo } from "./list.ts";
import { brandInfo } from "./fetch.ts";
import { furnish } from "../three/furniture.ts";
import { templateFor } from "../design/program.ts";
import { planOptionsFor } from "../design/options.ts";
import { buildingShell } from "../layout/footprint.ts";
import { DEFAULT_SHELLS } from "../layout/templates.ts";
import { marketOf } from "../budget/costs.ts";

const b = (name: string, level: number, products: string[], loved = false, affinity = 0.5): BrandInfo => ({ id: name, name, level, products, loved, via: [], affinity });

test("the list is what the 3D places that you'd buy, counted, with fitted work left to the budget", () => {
  const p = templateFor("house", 2);
  const layout = planOptionsFor(p, buildingShell(p, DEFAULT_SHELLS.house), { space_type: "house" })[0];
  const items = furnish(layout);
  const list = piecesOf(items, (id) => id);
  const count = (name: string) => items.filter((i) => i.name === name).length;
  assert.equal(list.find((l) => l.piece === "bed")!.qty, count("bed"));
  assert.ok(!list.some((l) => ["kitchen run", "toilet", "shower", "vanity", "island"].includes(l.piece)), "fitted work is in the budget, not the shop list");
  assert.ok(list.find((l) => l.piece === "sofa")!.rooms.length >= 1);
});

test("a piece goes to a brand that makes it, near their tier, loved brands first", () => {
  const brands = [b("Rug Co", 3, ["area_rugs"]), b("Sofa Lux", 4, ["sofas"]), b("Sofa Mid", 3, ["sofas", "chairs"]), b("Loved Basics", 2, ["sofas", "lighting"], true)];
  assert.equal(brandFor("rug", brands, "premium")!.name, "Rug Co");
  assert.equal(brandFor("sofa", brands.slice(0, 3), "premium")!.name, "Sofa Mid", "the one at their tier");
  assert.equal(brandFor("sofa", brands, "premium")!.name, "Loved Basics", "a brand they named wins a close call");
  assert.equal(brandFor("washer", brands, "mid"), null, "no brand in their taste makes it");
});

test("alternatives are the closest a level down and a level up", () => {
  const rivals = [b("Cheap", 1, []), b("Bit cheaper", 2, []), b("Same", 3, []), b("Dearer", 4, [])];
  const alt = alternatives(b("Ours", 3, []), rivals);
  assert.equal(alt.cheaper!.name, "Bit cheaper");
  assert.equal(alt.dearer!.name, "Dearer");
  assert.deepEqual(alternatives(b("Top", 4, []), [b("Also top", 4, [])]), { cheaper: null, dearer: null });
});

test("prices follow the tier and the market", () => {
  const us = marketOf("Austin, TX");
  assert.ok(priceEach("sofa", "luxury", us) > priceEach("sofa", "premium", us));
  assert.ok(priceEach("sofa", "premium", us) > priceEach("sofa", "essential", us));
  assert.ok(priceEach("sofa", "mid", marketOf("Pune")) / 88 < priceEach("sofa", "mid", us), "cheaper in India in dollars");
});

test("a brand's tags become its price level and what it makes; a matched brand says what it matched", () => {
  const e = {
    entity_id: "lamp",
    name: "Lamp Co",
    tags: [
      { tag_id: "urn:tag:price_level:qloo:_", name: "$$$" },
      { tag_id: "urn:tag:product_service:qloo:lighting_fixtures", name: "Lighting Fixtures" },
    ],
  };
  const p = { taste_signals: [{ entityId: "film", name: "A Film", layer: 3 as const }], taste: { tags: [], brands: [{ id: "lamp", name: "Lamp Co", affinity: 0.8, aesthetic: [], because: [{ entityId: "film", score: 0.4 }] }] } };
  const info = brandInfo(e, p);
  assert.equal(info.level, 3);
  assert.deepEqual(info.products, ["lighting_fixtures"]);
  assert.deepEqual([info.loved, info.via, info.affinity], [false, ["A Film"], 0.8]);
});
