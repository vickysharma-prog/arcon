import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { defineEvalConfig } from "eve/evals";

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });

export default defineEvalConfig({
  timeoutMs: 180_000,
  // The free Gemini tier allows only a few requests a minute, so evals run one at a time
  // and the judge uses a different model from the agent, with its own quota.
  maxConcurrency: 1,
  judge: { model: google.decisionModel("gemini-3.1-flash-lite") },
});
