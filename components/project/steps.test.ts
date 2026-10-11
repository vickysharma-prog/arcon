import { test } from "node:test";
import assert from "node:assert/strict";
import { canLeave, isStep, nextStep, STEPS } from "./steps.ts";

test("steps run in the agreed order", () => {
  assert.deepEqual(STEPS.map((s) => s.id), ["brief", "plans", "walkthrough", "budget", "shop", "drawings", "workspace"]);
});

test("next moves forward and stops at the workspace", () => {
  assert.equal(nextStep("brief"), "plans");
  assert.equal(nextStep("drawings"), "workspace");
  assert.equal(nextStep("workspace"), null);
});

test("the plans step needs a chosen plan before moving on", () => {
  assert.equal(canLeave("plans", { chosen_option: null }), false);
  assert.equal(canLeave("plans", { chosen_option: 0 }), true);
  assert.equal(canLeave("brief", { chosen_option: null }), true);
});

test("only known step names are accepted from storage", () => {
  assert.equal(isStep("budget"), true);
  assert.equal(isStep("admin"), false);
  assert.equal(isStep(null), false);
});
