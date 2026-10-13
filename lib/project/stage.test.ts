import { test } from "node:test";
import assert from "node:assert/strict";
import { isUnlocked, nextLine, stageOf, STAGES, tabsFor, unlockPrice, whoseName } from "./stage.ts";

const at = (status: Parameters<typeof stageOf>[0]["status"], chosen: number | null = 0) => ({ status, chosen_option: chosen });

test("each status lands on its stage", () => {
  const label = (s: Parameters<typeof stageOf>[0]["status"]) => STAGES[stageOf(at(s))].label;
  assert.equal(label("interview"), "Know you");
  assert.equal(label("designing"), "Design");
  assert.equal(label("ready"), "Design");
  assert.equal(label("review"), "Review");
  assert.equal(label("approved"), "Approved");
  assert.equal(label("building"), "Building");
  assert.equal(label("done"), "Moved in");
});

test("the next step is said to the person reading it", () => {
  assert.match(nextLine(at("ready", null), "owner"), /Pick one/);
  assert.match(nextLine(at("ready", null), "client"), /still being chosen/);
  assert.match(nextLine(at("review"), "client"), /approve it/);
  assert.match(nextLine(at("review"), "architect"), /Waiting for the client/);
  assert.match(nextLine(at("approved"), "builder"), /start building/);
});

test("tabs by role: viewers only look; only editors get Make changes; money and files lock until unlocked", () => {
  const ids = (role: Parameters<typeof tabsFor>[0], unlocked = true) => tabsFor(role, unlocked).map((t) => t.id);
  assert.deepEqual(ids("owner"), ["overview", "design", "thread", "money", "files"]);
  assert.deepEqual(ids("viewer"), ["overview", "design", "thread"]);
  assert.ok(tabsFor("architect", true)[1].steps.includes("workspace"));
  assert.ok(!tabsFor("client", true)[1].steps.includes("workspace"));
  const locked = tabsFor("owner", false);
  assert.deepEqual(locked.filter((t) => t.locked).map((t) => t.id), ["money", "files"]);
});

test("a project opens when paid, through a pro's live plan or trial, or as a demo", () => {
  const now = Date.parse("2026-10-13T12:00:00Z");
  assert.equal(isUnlocked({ unlocked_at: null }, [], now), false);
  assert.equal(isUnlocked({ unlocked_at: "2026-10-01T00:00:00Z" }, [], now), true);
  assert.equal(isUnlocked({}, ["2026-10-20T00:00:00Z"], now), true);
  assert.equal(isUnlocked({}, ["2026-10-01T00:00:00Z", null], now), false); // plan lapsed: read only again
  assert.equal(isUnlocked({}, [], now, true), true);
});

test("prices: $149 for a home, $299 for a business", () => {
  for (const t of ["house", "apartment", "studio", null]) assert.equal(unlockPrice(t), 149);
  for (const t of ["cafe", "office", "shop", "hotel"]) assert.equal(unlockPrice(t), 299);
});

test("a shared design is named for whoever it was designed for, else its owner", () => {
  assert.equal(whoseName("Priya Shah", "Ana Studio"), "Priya");
  assert.equal(whoseName(null, "Vicky Sharma"), "Vicky");
  assert.equal(whoseName("", null), null);
});
