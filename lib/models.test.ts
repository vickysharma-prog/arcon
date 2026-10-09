import { test } from "node:test";
import assert from "node:assert/strict";
import { route } from "./models.ts";

test("defaults to Gemini Flash", () => {
  assert.deepEqual(route({}), { via: "gateway", model: "google/gemini-3.5-flash" });
});

test("Gemini goes direct when its key is set", () => {
  assert.deepEqual(route({ GOOGLE_GENERATIVE_AI_API_KEY: "k" }), { via: "google", model: "gemini-3.5-flash" });
});

test("switching to Claude is one env var", () => {
  const env = { ARCON_MODEL: "anthropic/claude-sonnet-5.5", GOOGLE_GENERATIVE_AI_API_KEY: "k" };
  assert.deepEqual(route(env), { via: "gateway", model: "anthropic/claude-sonnet-5.5" });
  assert.deepEqual(route({ ...env, ANTHROPIC_API_KEY: "a" }), { via: "anthropic", model: "claude-sonnet-5.5" });
});

test("any other provider routes through the gateway", () => {
  assert.deepEqual(route({ ARCON_MODEL: "openai/gpt-6" }), { via: "gateway", model: "openai/gpt-6" });
});
