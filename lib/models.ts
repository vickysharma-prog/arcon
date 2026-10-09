import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

// One place picks the model for every agent. Switching models is one env var.
//   ARCON_MODEL="google/gemini-3.8-flash"     -> through Vercel AI Gateway
//   ARCON_MODEL="anthropic/claude-sonnet-5.5" -> through Vercel AI Gateway
// With GOOGLE_GENERATIVE_AI_API_KEY set and a bare Gemini id, Gemini is called directly (free AI Studio key).
export function chatModel(): LanguageModel {
  const id = process.env.ARCON_MODEL ?? "google/gemini-3.8-flash";
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (key && id.startsWith("google/")) return createGoogleGenerativeAI({ apiKey: key })(id.slice("google/".length));
  return id;
}
