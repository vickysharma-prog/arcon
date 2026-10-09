import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { defineEvalConfig } from "eve/evals";

// The judge grades replies with Gemini through the project's own key.
const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });

export default defineEvalConfig({
  timeoutMs: 120_000,
  maxConcurrency: 2, // the free Gemini tier allows only a few requests a minute
  judge: { model: google.decisionModel("gemini-3.5-flash") },
});
