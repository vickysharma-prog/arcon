import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

// One place picks the model for every agent. Switching models is one env var, no code change:
//   ARCON_MODEL="google/gemini-3.5-flash"      (the default)
//   ARCON_MODEL="anthropic/claude-sonnet-5.5"
// Each provider is called directly when its own key is set, otherwise through Vercel AI Gateway.

export type Route = { via: "google" | "anthropic" | "gateway"; model: string };

export function route(env: Record<string, string | undefined> = process.env): Route {
  const id = env.ARCON_MODEL ?? "google/gemini-3.5-flash";
  const [provider, ...rest] = id.split("/");
  const model = rest.join("/");
  if (provider === "google" && env.GOOGLE_GENERATIVE_AI_API_KEY) return { via: "google", model };
  if (provider === "anthropic" && env.ANTHROPIC_API_KEY) return { via: "anthropic", model };
  return { via: "gateway", model: id };
}

export function chatModel(env: Record<string, string | undefined> = process.env): LanguageModel {
  const r = route(env);
  if (r.via === "google") return createGoogleGenerativeAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })(r.model);
  if (r.via === "anthropic") return createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(r.model);
  return r.model;
}
