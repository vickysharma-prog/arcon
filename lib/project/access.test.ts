import { test } from "node:test";
import assert from "node:assert/strict";
import { can, invitable, type Action, type ProjectRole } from "./access.ts";

const ALL: Action[] = ["view", "comment", "edit", "invite", "approve", "site"];
const allowed = (role: ProjectRole) => ALL.filter((a) => can(role, a));

test("each role can do exactly its part", () => {
  assert.deepEqual(allowed("owner"), ALL);
  assert.deepEqual(allowed("architect"), ["view", "comment", "edit", "invite"]);
  assert.deepEqual(allowed("client"), ["view", "comment", "approve"]);
  assert.deepEqual(allowed("builder"), ["view", "comment", "site"]);
  assert.deepEqual(allowed("viewer"), ["view"]);
});

test("nobody without a role can do anything", () => {
  for (const a of ALL) {
    assert.equal(can(null, a), false);
    assert.equal(can(undefined, a), false);
  }
});

test("only the owner approves for themselves; the architect can't approve their own design", () => {
  assert.equal(can("architect", "approve"), false);
  assert.equal(can("client", "edit"), false);
  assert.equal(can("builder", "edit"), false);
});

test("the owner may invite anyone, an architect only the client, builder or viewers, others nobody", () => {
  assert.deepEqual(invitable("owner"), ["architect", "client", "builder", "viewer"]);
  assert.deepEqual(invitable("architect"), ["client", "builder", "viewer"]);
  for (const r of ["client", "builder", "viewer", null] as const) assert.deepEqual(invitable(r), []);
});
