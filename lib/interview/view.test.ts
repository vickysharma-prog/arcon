import { test } from "node:test";
import assert from "node:assert/strict";
import { activity, finishedProject, latestTaste, speakable, textOf, type Msg } from "./view.ts";

const tool = (toolName: string, output: unknown, state = "output-available") => ({ type: "dynamic-tool", toolName, state, output });
const msg = (id: string, ...parts: object[]): Msg => ({ id, role: "assistant", parts: parts as Msg["parts"] });

test("the newest taste profile wins", () => {
  const messages = [
    msg("1", tool("add_taste", { tasteCount: 1, style: [{ word: "vintage", from: ["A"] }], brands: [] })),
    msg("2", tool("add_taste", { tasteCount: 2, style: [{ word: "warm", from: ["B"] }], brands: [{ name: "X", look: ["oak"] }] })),
  ];
  assert.deepEqual(latestTaste(messages), { count: 2, style: [{ word: "warm", from: ["B"] }], brands: [{ name: "X", look: ["oak"] }] });
});

test("unfinished tool calls and other tools are ignored", () => {
  assert.equal(latestTaste([msg("1", tool("add_taste", undefined, "input-available"), tool("find_taste", { results: [] }))]), null);
  assert.equal(latestTaste([]), null);
});

test("the project id appears only once finishing succeeds", () => {
  assert.equal(finishedProject([msg("1", tool("finish_interview", { ready: false, stillNeed: ["x"] }))]), null);
  assert.equal(finishedProject([msg("1", tool("finish_interview", { ready: true, projectId: "p1" }))]), "p1");
});

test("text parts join into one message", () => {
  assert.equal(textOf(msg("1", { type: "text", text: " Hello. " }, tool("x", {}), { type: "text", text: "Which city?" })), "Hello.\n\nWhich city?");
});

test("speakable text drops markdown and keeps link words", () => {
  assert.equal(speakable("**Warm oak**, see [the plan](https://x.y).\n\n- low lamps"), "Warm oak, see the plan. low lamps");
});

test("activity shows labels and which calls are still running", () => {
  const m = msg("1",
    { type: "dynamic-tool", toolName: "find_taste", state: "input-available", toolMetadata: { eve: { label: "Looking up Ace Hotel" } } },
    tool("set_project", { saved: true }),
  );
  assert.deepEqual(activity(m), [
    { label: "Looking up Ace Hotel", working: true },
    { label: "set_project", working: false },
  ]);
});
