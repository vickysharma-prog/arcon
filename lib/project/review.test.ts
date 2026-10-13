import { test } from "node:test";
import assert from "node:assert/strict";
import { canSendForReview, eventText, statusAfter } from "./review.ts";

test("events read as plain sentences in the thread", () => {
  assert.equal(eventText({ type: "review", version: 3 }, "Ana"), "Ana sent version 3 for review.");
  assert.equal(eventText({ type: "approved", version: 3, note: "Love it" }, "Priya"), 'Priya approved version 3. "Love it"');
  assert.equal(eventText({ type: "changes", version: 3 }, "Priya"), "Priya asked for changes to version 3.");
  assert.equal(eventText({ type: "changed", version: 4, note: "Kitchen bigger" }, "Ana"), "Ana changed the design: Kitchen bigger (version 4).");
  assert.equal(eventText({ type: "joined", role: "builder" }, "Raj"), "Raj joined as the builder.");
});

test("review only once a plan is chosen, and not twice", () => {
  assert.equal(canSendForReview({ status: "ready", chosen_option: null }), false);
  assert.equal(canSendForReview({ status: "ready", chosen_option: 1 }), true);
  assert.equal(canSendForReview({ status: "review", chosen_option: 1 }), false);
  assert.equal(canSendForReview({ status: "approved", chosen_option: 1 }), false);
});

test("approval locks a version: a later change needs approving again", () => {
  assert.equal(statusAfter("send", "ready"), "review");
  assert.equal(statusAfter("approve", "review"), "approved");
  assert.equal(statusAfter("changes", "review"), "ready");
  assert.equal(statusAfter("edit", "approved"), "ready");
  assert.equal(statusAfter("edit", "review"), "ready");
  assert.equal(statusAfter("edit", "designing"), "designing");
  assert.equal(statusAfter("edit", "building"), "building");
});
