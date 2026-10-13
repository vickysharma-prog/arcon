import { test } from "node:test";
import assert from "node:assert/strict";
import { actionsFor, money, sideOf, standardSplit, step } from "./fees.ts";

test("who bills and who pays", () => {
  assert.equal(sideOf("architect", "owner"), "pro");
  assert.equal(sideOf("builder", "owner"), "pro");
  assert.equal(sideOf("owner", "owner"), "payer"); // a homeowner's own project
  assert.equal(sideOf("owner", "pro"), "pro"); // an architect's client project
  assert.equal(sideOf("client", "pro"), "payer");
  assert.equal(sideOf("viewer", "owner"), null);
});

test("billed by the pro, marked paid by the payer, confirmed by the pro, in that order", () => {
  assert.equal(step("planned", "bill", "pro"), "billed");
  assert.equal(step("planned", "bill", "payer"), null);
  assert.equal(step("billed", "paid", "payer"), "claimed");
  assert.equal(step("billed", "paid", "pro"), null);
  assert.equal(step("claimed", "received", "pro"), "received");
  assert.equal(step("billed", "received", "pro"), "received");
  assert.equal(step("planned", "received", "pro"), null);
  assert.equal(step("received", "bill", "pro"), null);
});

test("each side sees only its buttons", () => {
  assert.deepEqual(actionsFor("planned", "pro"), ["bill"]);
  assert.deepEqual(actionsFor("billed", "payer"), ["paid"]);
  assert.deepEqual(actionsFor("billed", "pro"), ["received"]);
  assert.deepEqual(actionsFor("received", "pro"), []);
  assert.deepEqual(actionsFor("billed", null), []);
});

test("the standard split adds up to the total", () => {
  const parts = standardSplit(250001);
  assert.deepEqual(parts.map((p) => p.label), ["Design", "Approval of the final design", "Handover"]);
  assert.equal(parts.reduce((s, p) => s + p.amount, 0), 250001);
  assert.equal(parts[0].amount, 75000);
});

test("money reads the local way", () => {
  assert.equal(money(250000, "INR"), "₹2,50,000");
  assert.equal(money(4000, "USD"), "$4,000");
});
