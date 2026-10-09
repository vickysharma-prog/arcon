# State

Where Arcon stands right now. Updated at the end of every working session.

## Done

- Next.js 16.4 app with the Arcon look, live at arcon-ten.vercel.app, auto-deploying from GitHub.
- Layout engine: program to plan, three options per space type, validator, open-plan walls shared by 2D and 3D.
- Qloo client with a shared Supabase cache, a 5-per-second limiter and retry on 429. Three-layer taste engine.
- Supabase: `qloo_cache`, `projects`, `project_versions`, `agent_sessions`, with migrations and integration tests.
- Model picker: Gemini by default, Claude or any gateway model with one env var.
- Signed guest cookie on every browser; agents accept only requests carrying it.
- Interviewer agent (eve) with five tools, plain-English voice rules, and 13 evals including adversarial ones.
- Interview screen with voice and text. Design step: brief, room program, three plans.
- Wizard: Your style, Plans and Walkthrough are live; Budget, Drawings and Make changes are placeholders.
  Next sits top right on every step.
- 3D model of the chosen plan, styled from the brief and the Qloo taste profile:
  - furniture built from parts, six furniture styles chosen by taste, and the loves that chose it shown;
  - feature walls, art, curtains, backsplash and tile from the brief; plank and tile floors; ambient occlusion;
  - Walk through (guided tour with sound), Explore inside (keys, clicks, mini-map, walls stop you),
    Look around (section cut at 1.4 m, room labels you can fly to, opens on the ground floor), full screen.
- 105 unit tests passing; `scripts/check-choose.ts` checks plan choice end to end in Chrome.

## Next (tomorrow)

1. Plan options from the interview: concept library (central hall to street, to garden, open great room,
   split plan), ranking from the interview and Qloo taste, a "why this fits you" per option, and a
   "how you live in it" step in the interview. The design is in `private/plan.md`.
2. Then Budget, Drawings and the Workspace with the designer agent.

## Known issues

- The three plan options today are one idea flipped and mirrored (item 1 above fixes it).
- The brand filter lets French Connection and Homestyler through.
- Demo projects pile up in Supabase; a cleanup script is needed.
- The photoreal render button needs paid image quota (free Gemini image quota is zero).

## Known limits of the free model tier

- Gemini free tier limits are per project, per model. The daily quota resets at midnight Pacific (about 12:30 pm IST).
- Evals run one at a time; the judge uses `gemini-3.1-flash-lite` so its quota is separate from the agent's.

## Waiting on

- Nothing blocking. The final model choice comes around 20 to 25 Oct after comparing models on the evals.
