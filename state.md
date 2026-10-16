# State

Where Arcon stands right now. Updated 16 Oct 2026, evening (IST), at the end of a long session, for the next one to
pick up with nothing lost. Dated detail is in progress.md (newest first); every decision is in private/plan.md.

## Start here (next session)

1. Read, in order: the local working agreement (loads by itself), this file, the top entries of `progress.md` (all of 16 Oct),
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

arcon-ten.vercel.app, auto-deploying from GitHub main (vickysharma-prog/arcon, private until submission). The
last commit 110212a is live, 348 unit tests pass, tsc and the build are clean, and every live check passes
(`scripts/live-check.ts`, 50+ checks).

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

The end-to-end run in Chrome stopped after Journeys 1 and 2: read `private/e2e-run.md` ("Where this run stopped"),
run Journeys 3 to 8 the same way, then work through its fix list (worst first) with Vicky. 15 local commits are not
pushed yet (the sidebar, management views, flow fixes, change requests, move-in): push only after Vicky approves,
then run the live checks and add live checks for /api/shell, the new views and /api/projects/[id]/movein.

## What's left, in order (deadline 30 Oct 11:45pm ET = 31 Oct about 9:15am IST)

1. **The app frame and sidebar** (built 16 Oct evening, two local commits not pushed): Vicky to review; then check
   phone width, dark mode and a guest on a project, push, run live checks, add a live check for /api/shell.
1b. **From the flow audit** (private/flows-audit.md): the builder's quote, fees from the site's phases, the
   architect's site visits. (Move-in flow done 16 Oct night.)
2. **US demo world** (part of R5; judges are American, Jason Calacanis leads): a family house in Los Angeles in
   review, a café in New York with the neighbourhood read, an architect's studio in Austin with three clients, a
   builder's live site; fees in dollars. Then the judge demo: /demo with role cards and a role switcher bar.
3. **The 30-second video** (L2): a real recording of the LA family house, interview to 3D, captions, Arcon's sounds
   when unmuted; Puppeteer, Chromium and ffmpeg are on this machine. It goes on the landing page and in the
   submission.
4. **PayPal sandbox** (R5): a project order ($149, $299 business), Studio and Build subscriptions with the 14-day
   trial, a webhook. Needs Vicky's sandbox keys.
5. **F1 quality:** model comparison and evals, adversarial tests of the agents, a cleanup script for test data (test
   projects, the business test café, the "Pune house" guest project), speed, task #62 (3D room labels without
   separate React roots), task #63 (check the city in the interview against the map: "Delih" went to Slovenia),
   lint, and the dev-mode reload loop on /home (production is fine).
6. **C2b photoreal renders,** 28 to 29 Oct, on about $10 of Gemini credit from Vicky.
7. **F2:** polish, README, the submission text with the business story (sourced market numbers, pricing, roadmap)
   for Jason, scrub `private/` and Qloo data from the whole history (filter-branch, keep the day-by-day commits), make
   the repo public with the MIT licence visible, submit on Devpost.

Open questions for Vicky: hide the Apple sign-in button until there's a paid developer account? A mail sender for
confirmation emails (Gmail SMTP was the suggestion), later.

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
  d494ab31 (Austin office), 50c3d046 (Delhi house exterior test, "Delih"), 2418b263 (self-build), and the Brooklyn
  café copy owned by the business test account. Their fees are in rupees; the US demo world replaces them for the demo.

## Known issues

- /home in dev mode (`next dev`) reloads in a loop with "The server could not finish this Suspense boundary";
  production builds and the live site are fine. Investigate in F1.
- 3D room labels log a React warning in development when leaving the 3D (task #62).
- A typo'd city geocodes to the wrong place (task #63).
- On a busy laptop (Vicky's CPU was at 91% with Chrome, Spotify, VS Code) the landing film can still stutter.
- Google's sign-in page names the Supabase address, not "Arcon" (needs Supabase's paid custom domain).
- The project page has two old lint errors about state set in effects.
