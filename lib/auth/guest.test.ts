import { test } from "node:test";
import assert from "node:assert/strict";
import { readCookie, signGuest, verifyGuest } from "./guest.ts";

const SECRET = "a".repeat(32);
const ID = "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90";

test("a signed guest id verifies", async () => {
  assert.equal(await verifyGuest(await signGuest(ID, SECRET), SECRET), ID);
});

test("tampered, foreign or malformed cookies are rejected", async () => {
  const good = await signGuest(ID, SECRET);
  const otherId = "00000000-0000-4000-8000-000000000000";
  assert.equal(await verifyGuest(`${otherId}${good.slice(36)}`, SECRET), null); // id swapped
  assert.equal(await verifyGuest(good.slice(0, -1) + "0", SECRET), null); // signature changed
  assert.equal(await verifyGuest(good, "b".repeat(32)), null); // signed with another secret
  for (const bad of [undefined, null, "", "no-dot", `${ID}.`, "x.y"]) assert.equal(await verifyGuest(bad, SECRET), null);
});

test("short secrets are refused", async () => {
  await assert.rejects(signGuest(ID, "short"), /32 characters/);
});

test("only UUIDs are signed", async () => {
  await assert.rejects(signGuest("not-a-uuid", SECRET), /UUID/);
});

test("cookies are read from a Cookie header", () => {
  assert.equal(readCookie("a=1; arcon_guest=x.y%3D; b=2", "arcon_guest"), "x.y=");
  assert.equal(readCookie(null, "arcon_guest"), null);
  assert.equal(readCookie("a=1", "arcon_guest"), null);
});
