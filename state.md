# State

Where Arcon stands right now. Updated as we go (Vicky's rule): progress, context and decisions.

## Done

- Next.js 16.4 app, live at arcon-ten.vercel.app, auto-deploying from GitHub.
- Qloo client with a shared Supabase cache, limiter and retry; three-layer taste engine.
- Supabase tables and migrations; model picker (Gemini now, any model by one setting).
- Interviewer agent (eve) with voice and text: project, people, needs, how you live (homes), taste, budget.
  15 evals including adversarial ones.
- Design step: brief, room program, and three plans picked for how the user lives:
  - four layout concepts (central hall to the street or garden, open great room, split plan);
  - ranked from the interview and the Qloo taste, each with reasons in the user's own words;
  - each card shows what that plan does best and gives up against the other two.
- Architect rules in the validator and tests (stairwell, doors, room sizes, front door, en-suites,
  furniture on walls, walk never through a wall). Fuzz test on 600 random programs per run.
- 3D: taste-styled furniture and walls, U stair, Walk through (a real route), Explore inside, Look around
  with section cut, room labels and Whole house. Plans and wording work for every space type.
- 149 unit tests passing.

## In progress

- A5: how a business runs. Built: save_running tool, ranking with the user's words, program sizing, evals.
- A4: bring your own plan. Built and working end to end (upload at /start/plan, Gemini reads it, snap cleans it, Check your plan screen, taste, then the user's plan plus two engine alternatives). Checked live end to end (upload, check, design, plans) and with a PDF. Taste questions: all three required, each looked up by kind and shown to the user before use. Later polish: show the uploaded image beside the read plan (needs file storage).

## Next

- A5: business "how you run it" interview step.
- B1 to B4: taste card and moodboard, budget, greenery and timeline, shopping list.
- Then the workspace with the designer agent.

## Known issues

- Some 3D details Vicky flagged are still to revisit (task: leftovers from the 3D review).
- Brand filter lets French Connection and Homestyler through (B1).
- Demo projects pile up in Supabase; cleanup script pending (F1).
- Photoreal render needs paid image quota (C2).

## Known limits of the free model tier

- Gemini free tier limits are per project, per model; the daily quota resets at midnight Pacific.
- Evals run one at a time; the judge uses `gemini-3.1-flash-lite`.

## Waiting on

- Nothing blocking. Final model choice around 20 to 25 Oct.
