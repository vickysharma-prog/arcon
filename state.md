# State

Where Arcon stands right now. Updated 23 Oct 2026 (IST), for the next session to start here with nothing lost.
Dated detail is in progress.md (newest first); decisions are in private/plan.md (see "Judge demo (decided 21 Oct)").

## Start here (next session)

**Where we are:** the app, the judges' demo and the 3D are done and live. What's left is the submission: Devpost text,
a video with voiceover, cleaning the git history, making the repo public, submitting. Deadline: **30 Oct 2026,
11:45pm ET (31 Oct about 9:15am IST).** Vicky's call (23 Oct): the walk camera is fine as it is, leave it.

Read first: this section, then progress.md entries of 22 and 23 Oct. Then go through the list below, in order.

### What's left, in order

1. **Devpost submission text** (draft it, Vicky edits). Devpost asks for: what it does, how it was built, challenges,
   what was learned, what's next, and the tech used. Must cover: how Qloo is used (taste graph read from three picks,
   style words with sources, brands matched by taste, the neighbourhood read for business spaces, the moodboard, art
   and playlist, the furniture style and exterior from taste); the agentic parts (eve interviewer, design pipeline:
   brief, room programme, three plans; chat edits); the whole-project story (owner, architect, builder, client: review,
   quote, fees by phase, site, move-in); the judges' demo link (arcon-ten.vercel.app, "For judges"); the market
   (Harvard JCHS: almost 26 million US homeowner households improved their homes in 2023, LIRA $518B, Houzz $24K
   median kitchen; sources linked on the landing page); pricing as on the landing page (Free; Project $149 / $299
   business; Studio $99 a month; Build $299 a month; 14-day trials; PayPal comes after the hackathon); what's next
   (PayPal, photoreal renders, more space types, native apps). Plain English, few em dashes, never name another
   person's project, describe scope not limitations. Write it in a doc or a local file for Vicky to paste.
2. **Video script + recording.** Devpost wants a video (YouTube/Vimeo link, usually under 3 minutes). Write a script
   that follows the judges' tour (15 stops, below) with a voiceover; Vicky records her screen and voice. The silent
   59 s film already exists (scripts/record-video.ts, in Supabase storage "media"); it can be cut in.
3. **Clean the git history, then make the repo public.** The repo is private: github.com/vickysharma-prog/arcon.
   - Remove from every commit: the `private/` folder (plan.md, e2e-run.md, flows-audit.md, qloo-findings.md hold Qloo
     response data and our notes), and any line naming the AI tool (they sit in state.md in some
     16 to 17 Oct commits). Keep every commit and its date (the day-by-day history matters to Vicky).
   - How: back up first (`git clone --mirror` to a folder outside the repo). Then
     `git filter-branch --index-filter "git rm -r --cached --ignore-unmatch private" --tree-filter "<sed on state.md>"
     -- --all` (or git filter-repo if installed: `--path private --invert-paths` plus `--replace-text`). Then check:
     the attribution check from the working agreement, run over `git log --all -p`, must find nothing but model id
     strings in code, and `git log --all -- private` must be empty. Force-push only after
     Vicky says yes (it rewrites the public history). Keep `private/` locally (add it to .gitignore).
   - LICENSE (MIT) is already in the repo. Then flip the repo to public on GitHub (Vicky does it, or `gh repo edit
     --visibility public` with her yes).
   - The two agent instruction files are in .git/info/exclude: they must stay out of the repo.
4. **The day before judging (29 or 30 Oct):**
   - Run `node --env-file=.env.local --env-file=.env scripts/demo-refresh.ts`. The demo sites' dates are set from
     "today" (Maya's current phase began 3 weeks ago, Ana's last phase ends in 10 days, crew marked on site from 3 weeks
     back to 6 weeks ahead). As days pass, phases start reading as late. This re-anchors them in 10 seconds.
   - Gemini: the tour itself never calls a model (all seeded). Only "Try it yourself" does: a judge's own design runs
     the brief, programme and plans on Gemini. The free quota ran out once (17 Oct) after a few designs. Vicky to add
     billing or a paid key so judges never see an error. Then run one design on live to be sure.
   - Run `node --env-file=.env.local --env-file=.env scripts/live-check.ts` (all must pass) and walk the tour once on
     live from the landing page's "For judges".
5. **Submit on Devpost** before the deadline: link, repo, video, text. Vicky submits.
6. Optional if time is left: re-run the eve eval suite (`npm run evals` style, it boots a dev server; it needs Gemini
   quota), photoreal renders (C2b), README section for judges (the README doesn't mention /demo yet: add a short
   "For judges" line with the link).

### The judges' tour (live, /demo)

Entry: landing page, "For judges" (first button in the hero, and in the header). 15 stops, view only, Back/Next beside
each page title and in a glass pill at the bottom (opens on hover: caption, switch person, exit). Between stops a
screen with Arcon's mark; "Scroll for more" on long pages.
1 interview replay (Maya's answers play themselves, 1x/2x, skip; moves on by itself) · 2 Qloo reads her taste ·
3 three plans · 4 3D walk (#walk) · 5 Look around (#inside: the ground floor opened, rooms named; All floors puts the roof back) · 6 budget ·
7 shopping list · 8 drawings and files · 9 Lena's studio · 10 one thread for everyone · 11 Mike's day on site ·
12 the building site · 13 Ana's last week (snags, handover) · 14 Sam's café in 3D (#inside) · 15 the neighbourhood
read (#neighbourhood), then "Try it yourself" (fresh interview, no sign-in, the judge's project opens unlocked).

How it works: app/demo/route.ts signs in as a demo account (lib/demo/ids.ts) and sets the `arcon_demo` cookie; the
stops are lib/demo/tour.ts; components/demo/JudgeBar.tsx draws the pill, the veil, the hint and JudgeNext. proxy.ts
refuses every write from the four demo accounts (403 with x-arcon-demo: view-only; the pill shows a note). Leaving with
"Try it yourself" sets `arcon_judge`, so app/api/interview/route.ts creates their project unlocked.

The demo world (built 22 Oct through the real app by scripts/demo-world.ts): Lena Ortiz (Ortiz Studio, LA, architect)
with Maya Reyes's house (Silver Lake, 75%, quote $990K accepted, visits, sign-offs), the Parks' house (in review) and
Ana Silva's apartment (96%, last week); Mike Dawson (Dawson Build Co., builder); Sam Okafor's Brooklyn café. Story
answers in lib/demo/story.ts. **Don't rerun demo-world.ts unless something is broken:** it deletes and rebuilds the
demo projects (new ids, about 15 minutes, 4 Gemini designs) and needs a local server started with ARCON_DEMO_SEED=1
(otherwise the proxy blocks the demo accounts' writes).

### Working notes (save time)

- Local check of a change: `npx next build`, then `npx next start -p 3001` in the background. Port 3000 often stays
  held by a stale server; if a start fails with EADDRINUSE, stop node processes whose command line has "next start"
  (PowerShell Get-CimInstance Win32_Process) and start again.
- 3D pictures for checking by eye: `node --env-file=.env.local --env-file=.env scripts/shots-3d.ts <projectId> <out dir>`
  (WALK=0 skips the walk). Maya's project id: 53815dca-b4f2-447e-8d78-4e6bffe36c24; Sam's: 129e5b40-56d2-4dd3-bb47-b127cb01c739.
- Edits by Python script: use raw strings for regex (a plain "\b" becomes a backspace byte).
- Before every commit: `npm test` (412 pass) and `npx tsc --noEmit`; before push the attribution grep; after push
  `scripts/live-check.ts`. Commits as vicky sharma <raghunathsharma296@gmail.com>, no AI attribution lines.
- Decided and done: fonts Funnel Display / Funnel Sans / Martian Mono; Apple sign-in button stays; no PayPal for the
  hackathon; the walk camera stays as it is.

## Live

arcon-ten.vercel.app, auto-deploying from GitHub main (vickysharma-prog/arcon, private until submission). Last
commit is pushed and live; 412 unit tests pass, tsc and the build are clean, every live check passes.

# History (older notes, kept for reference)

## What Arcon is now (16 Oct)

- **Landing:** the opening (mark, "Arcon", boot sound) plays whenever Arcon opens, on any page, once a visit. Hero
  with a 3D film (each floor as a sketch, then in colour, then night; dissolves between them; draws lighter on slow
  computers and stops off screen). A live Qloo strip (Grand Budapest Hotel + Aman Tokyo, Frank Ocean + Blue Bottle,
  Succession + Soho House New York). How it works (animated), the taste flow, features, who it's for, why it matters
  ($518B, Harvard JCHS LIRA April 2026; $24K median kitchen, Houzz & Home 2026; both linked), pricing, questions
  (FAQ), final call. Header: How it works, Taste, Features, Pricing, Resources; Get the app; Sign up free, or My
  projects when signed in.
- **Signed in, "/" opens /home**; "/?site" shows the site itself.
- **The app frame (16 Oct evening):** signed-in pages (app/(app): home, project, account, /pros, /pros/[id]) sit in a
  sidebar layout: role tools in groups, the open project's parts as a tree, every project, profile bottom left, Ctrl+B
  rail, phone drawer; search, Get the app and the bell top right. Home opens on the project last opened (?p=), and each
  tool is a view (?view=waiting, inbox, all, pipeline, today, requests, fees, crew, deliveries, money). Fee ledger for
  everyone; Crew & wages, Materials & deliveries and Site money for whoever runs sites. Guests keep the site header.
- **Roles at sign-up (16 Oct, merged): Owner** (home or business; home page "My spaces"), **Architect or interior
  designer** ("Studio"), **Builder or contractor** ("Sites"). The kind of space on the project decides the business
  parts (opening day, neighbourhood read, $299).
- **Home pages:** status line, "Waiting on you" (reviews, changes asked, fees, late work, plans to choose, messages),
  plans that draw themselves on every card. My spaces: newest project in focus, View in 3D on a tap, stage rail,
  next step, mid-range estimate, opening day for a business. Studio: fees billed and received, clients in six
  read-only stage columns. Sites: billed and received, today on every site, other projects.
- **Ctrl+K** (⌘K, or the search button): every project and its parts, and the app's pages.
- **Resources** (/resources): Arcon in two minutes, your home page, search and the app, deleting, guides per role,
  taste to design, questions, developer guide (layout, running it, the API), data and privacy.
- **Accounts:** email and password, Google; Apple button waits on a paid Apple developer account. Sign-up refuses
  addresses whose domain can't take mail (public DNS) and throwaway inboxes; no confirmation email yet (Vicky: later).
  Profile button shows the logo or the first letter. Delete my account (red, type DELETE) on /account; delete a
  project from its card or its overview (owner only).
- **The app:** installable (PWA): "Get the app" opens a panel with a code for the phone and, in Chrome or Edge,
  Install for the computer; on phones it installs or shows the steps. Offline page. Logo in the browser tab.
- **Everything built before** (see progress.md): the interview with the taste quiz, Qloo style, moodboard, taste
  trail, three plans with trade-offs, 3D walkthrough with moods, art and sound, day and night, exterior from taste,
  budget in eight markets, greenery and timeline, shopping list, changes by chat with versions, drawings pack (PDF,
  DXF), teams and invites, the project thread with review and approval, Studio tools and fees, the building site in
  full, the neighbourhood read for businesses.

## Resume here (next session, first thing)

17 Oct: the re-check passed (private/e2e-run.md), the landing page and Resources were updated, taste picks are now
famous names with a clear look each, sign-in is asked for at unlock (try first, sign in to keep: Vicky's decision).
All pushed and live; live checks pass.

17 Oct (evening): For pros redesigned (AI vs Manage, a live screen per capability, links into Resources#architects
and #builders, which now explain everything in depth). The film (59 s, every role, sound off until asked) is recorded
(scripts/record-video.ts, re-run any time) and plays on the landing page from Supabase storage (bucket "media",
public), never from the repo. Pricing: Vicky wants to brainstorm it next.

Open for Vicky: US demo pros with work (data in the live database), the site materials list in m² and kg on US
projects, whether to keep the eve interviewer agent (mounted at /eve/interviewer, nothing in the app calls it now),
and what else she wants on the landing page.

## 17 Oct (night): flow-audit items and quality, done

- Market strip: almost 26 million US homeowner households improved their homes in 2023 (Harvard JCHS, Improving
  America's Housing 2025, page 2).
- Builder's quote (migration 016, lib/project/quote.ts, /api/projects/[id]/quote, QuoteCard on the site): the builder
  sends a price; whoever approves the design accepts or declines it (in person too); accepted, it's the site's budget
  on the site and in Site money. Waiting on you: "Answer the builder's quote".
- Fees from the site's phases (phaseSplit, dueWhen): a builder's fee on a running site splits into a deposit, one part
  per phase by how long it runs, and handover; each fee shows when it's due and "done: bill it"; the pro gets a bell
  when a phase finishes (and on site start and move-in), and "Bill" in Waiting on you.
- Architect on site: site visits (logged in the thread) and "Sign off this stage" on finished phases, for the
  architect on the project or an architect whose own project it is.
- Interview city check (/api/city, OpenStreetMap): matches with their country as they type; "Delih" now says it isn't
  on the map. US sites order flooring in sq ft and steel in pounds.
- scripts/clean-test-data.ts: deleted 6 leftover test projects (empty "Priya's house" and "Sam's house", three test
  projects); keeps the live-check and film projects.
- Model comparison (scripts/compare-models.ts) on three real projects: all 9 runs passed the schema, 0 invented
  credits, 3 plans from the model every time; Flash-Lite fastest for the room list (1.5 to 2.5 s vs about 10 s).
- The eve interviewer agent stays (Vicky left it to me).
- Checked in the browser (17 Oct, late): quote send, accept and the site budget; fees by phase with "done: bill
  it", the bell and "Bill"; architect visits and sign-off; the city check; 3D room labels (one overlay now, no
  warning when leaving the 3D in dev); the dev-mode reload loop on /home no longer happens.
- Landing taste graph redrawn (components/landing/TasteGraph.tsx): loves on the left, Qloo's taste words around a
  hub with weights, design choices with material swatches on the right, links that draw in with pulses. Phones keep
  the three columns.
- Evals: hindi, hotel-guests, running-cafe and running-office now pass after instruction fixes (office headcount
  saved as people, hotel guests asked, stillNeed asked first). The full suite re-run is waiting on Gemini quota.
- **Gemini free quota ran out on 17 Oct for all three models.** It resets at midnight Pacific (about 12:30pm IST).
  Until then new designs, briefs and chat edits the rules can't read fail on live. Options for Vicky: wait, or a
  paid key / AI Gateway credit before the judges look.
- Fixed: Brooklyn shows as Brooklyn, NY (not New York, NY); an owner with a builder is no longer offered "I'm
  managing the build myself".
- Next with Vicky: pricing and the judge demo (brainstorm).

## What's left

See "Start from here" at the top.

## How we work (rules that hold every session)

- Commits as `vicky sharma <raghunathsharma296@gmail.com>`, in Vicky's voice; no AI attribution anywhere; the
  attribution check before every push (in the local working agreement). Never commit the local agreement files.
- `npm test` and `npx tsc --noEmit` before every commit; `npx next build` before a push (free port 3000 first).
- After a push: wait for the deploy (`gh api repos/vickysharma-prog/arcon/commits/<sha>/status --jq .state`), run
  `node --env-file=.env.local --env-file=.env scripts/live-check.ts`, and add a live check for each new feature.
- Open every user-facing build in our own browser tab for Vicky (tab group, never her tab).
- Every screen gets the techy feel: the shared sounds (tick, ok, chime, whoosh, transition), motion, Decode headings.
- Keep progress.md (newest first), this file and private/plan.md current; date and explain every decision change.
- Naming is Vicky's call: offer options, never pick. US-centric demos and examples (dollars, US cities, US culture).
- Keys only in .env, .env.local and Vercel. Qloo data never in the repo. Never name another person's project.
- Patch files with Python scripts written to the scratchpad when the change is long; Bash heredocs with complex
  content break.

## Local testing

- Sign in as a test role: sign out (`DELETE /api/session` from a localhost page), then
  `node --env-file=.env.local scripts/test-users.ts <role> "http://localhost:3000/auth/callback?next=%2Fhome"` and
  open the link. Roles: owner, business (an owner with the Brooklyn café), architect, builder, client, priya. Never
  repeat the test password.
- Afterwards: sign out; restore Vicky's local guest cookie with `/api/claim?t=<her guest token>&next=/` (the token is
  in the local memory note "arcon-local-testing", not in the repo); run
  `node --env-file=.env.local scripts/release-test-projects.ts`.
- Test projects: 2ec977ae (Austin house, building; owner, client and builder Raj), 6aa147ed (New York café),
  2418b263 (self-build), and the Brooklyn
  café copy owned by the business test account. Their fees are in rupees; the US demo world replaces them for the demo.

## Known issues

- Gemini free quota: see 17 Oct (night) above; re-run the full eval suite once it resets.
- On a busy laptop (Vicky's CPU was at 91% with Chrome, Spotify, VS Code) the landing film can still stutter.
- Google's sign-in page names the Supabase address, not "Arcon" (needs Supabase's paid custom domain).
- The project page has two old lint errors about state set in effects.
