# State

Where Arcon stands right now. Updated at the end of every working session.

## Done

- Next.js 16.4 app with the Arcon look, live at arcon-ten.vercel.app, auto-deploying from GitHub.
- Layout engine: program to plan, three options per space type, validator. Unit tests for all seven space types.
- Qloo client with a shared Supabase cache, a 5-per-second limiter and retry on 429. Three-layer taste engine.
- Supabase: `qloo_cache`, `projects`, `project_versions`, `agent_sessions`, with migrations and integration tests.
- Model picker: Gemini by default, Claude or any gateway model with one env var.
- Signed guest cookie on every browser. The agents accept only requests carrying it (live: 401 without, 202 with).
- Interviewer agent (eve) with five tools, plain-English voice rules, and 13 evals including adversarial ones.

## In progress

- Running the interviewer evals in small batches within the free Gemini quota.
- Next: bind sessions to projects from the web app, the interview screen with voice and text, and the designer agent.

## Known limits of the free model tier

- Gemini free tier limits are per project, per model. The daily quota resets at midnight Pacific (about 12:30 pm IST).
- Evals run one at a time; the judge uses `gemini-3.1-flash-lite` so its quota is separate from the agent's.

## Waiting on

- Nothing blocking. The final model choice comes around 20 to 25 Oct after comparing models on the evals.
