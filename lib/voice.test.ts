import { test } from "node:test";
import assert from "node:assert/strict";
import { voiceProblems } from "./voice.ts";

test("a plain reply passes", () => {
  assert.deepEqual(voiceProblems("Warm oak, low lamps and a lot of books. Who else lives with you?"), []);
});

test("banned words are caught in any form", () => {
  assert.deepEqual(voiceProblems("Let's delve into it."), ["banned word: delve"]);
  assert.deepEqual(voiceProblems("We leveraged the light."), ["banned word: leverage"]);
  assert.deepEqual(voiceProblems("A robust, seamless plan."), ["banned word: robust", "banned word: seamless"]);
});

test("words that merely contain a banned word are fine", () => {
  assert.deepEqual(voiceProblems("The journeyman fostered nothing; navigation lights"), ["banned word: foster"]);
  assert.deepEqual(voiceProblems("A curated shelf"), ["banned word: curate"]);
  assert.deepEqual(voiceProblems("Cruciality and robustness"), []);
});

test("stock openers and closers are caught", () => {
  assert.deepEqual(voiceProblems("Great question! The kitchen faces south."), ["preamble opener"]);
  assert.deepEqual(voiceProblems("Absolutely, here it is."), ["preamble opener"]);
  assert.deepEqual(voiceProblems("Here is the plan. I hope this helps!"), ["stock closer"]);
});

test("one em-dash per 200 words is the budget", () => {
  assert.deepEqual(voiceProblems("Oak floors — warm light."), []);
  assert.deepEqual(voiceProblems("Oak — warm — light."), ["too many em-dashes: 2"]);
});
