# State

Where Arcon stands right now. Updated 17 Oct 2026, late night (IST), at the end of a long session, for the next one to
pick up with nothing lost. Dated detail is in progress.md (newest first); every decision is in private/plan.md.

## Start here (next session)

1. Read, in order: the local working agreement (loads by itself), this file, the "Start from here" list below, the top entries of `progress.md` (all of 17 Oct),
   and in `private/plan.md` the sections "Decisions, 16 Oct 2026" and "Decisions (settled 9 Oct 2026)", then the
   rest of the plan as needed. The memory index (MEMORY.md) loads by itself.
2. Open the role homes for Vicky, side by side, on the local production build (same code as live):
   - `npx next build`, then `npx next start -p 3000` in the background (free port 3000 first).
   - `node --env-file=.env.local --env-file=.env scripts/role-sessions.ts <scratchpad>/sessions.json`
   - In four tabs of our own tab group (never Vicky's own tab): `localhost:3000` (owner, a house),
     `127.0.0.1:3000` (owner, "The Brooklyn café"), `[::1]:3000` (architect, Studio), `builder.localhost:3000`
     (builder, Sites). On each host set `document.cookie = "arcon_user=<value>; path=/; samesite=lax"`, then /home.
   - The live site is the same code, but the test accounts are never signed into the live site in Vicky's browser
     (her rule: live checks with test accounts run from the server only). Vicky can sign in on live herself.
3. Tell Vicky what is left (the list below), then ask: "Anything to change on the home pages (My spaces, Studio,
   Sites)?" Her changes come first, then the next steps in order.

## Live

arcon-ten.vercel.app, auto-deploying from GitHub main (vickysharma-prog/arcon, private until submission). Last
commit 43bd603 is pushed and live; 402 unit tests pass, tsc and the build are clean, every live check passes.

## Start from here: what's left (17 Oct, late night)

Built and live: all the planned features (A1 to A5, B1 to B4, C1, C2 video, D1 to D3, E1 site tracking, E2, Q7, Q10,
P7 app, the flow-audit items). What remains, in order:

1. **Gemini quota (now).** Free quota ran out on 17 Oct; resets at midnight Pacific (about 12:30pm IST). Vicky to
   decide: wait, or a paid key / AI Gateway credit so the judges never hit it. Then re-run the full eval suite.
2. **Brainstorm with Vicky (do not build before):** pricing (plans, prices, what's free, the paywall moment) and the
   judge demo (how a judge gets in, which roles and projects they see, a role switcher).
3. **US demo world:** a family house in Los Angeles in review, a café in New York with the neighbourhood read, an
   architect's studio in Austin with three clients, a builder's live site; fees in dollars; demo pros with work.
4. **Judge demo build:** /demo with role cards and a role switcher bar, from the brainstorm.
5. **Pricing: no PayPal for the hackathon (Vicky, 21 Oct).** Pricing shows on the landing page only; PayPal
   sandbox is after the hackathon.
6. **F1 quality, the rest:** adversarial tests of the agents, speed pass, full eval re-run (after item 1).
7. **C2b photoreal renders,** 28 to 29 Oct, on about $10 of Gemini credit from Vicky.
8. **F2 submission:** polish, the submission video with voiceover, submission text with the business story
   (sourced numbers, pricing, roadmap), scrub `private/`, Qloo data and the old tool-name lines in state.md (16 to 17 Oct commits) from
   the whole history (filter-branch, keep the day-by-day commits), make the repo public with the MIT licence,
   submit on Devpost before 30 Oct 11:45pm ET.

Apple sign-in button stays as it is (Vicky, 21 Oct). Open: a mail sender for confirmation emails (Gmail SMTP
suggested)? Also (21 Oct): Vicky wants a more techy font than Geist; options being brainstormed.

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
