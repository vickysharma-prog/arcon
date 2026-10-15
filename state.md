# State

Where Arcon stands right now (updated 12 Oct, end of day). Dated detail is in progress.md; the plan and
decisions are in private/plan.md.

## Live

arcon-ten.vercel.app, auto-deploying from GitHub (main). 273 unit tests pass; build is clean.

## Built

- **Landing:** logo intro with sound, hand-drawn 3D hero with its plan, how it works, Qloo taste flow, features,
  audience, pricing, sign-up.
- **"Let's get to know you":** fixed questions with the terminal animation and sound, taste picks confirmed with
  Qloo, live taste card, voice mode. AI only after the questions. Or upload your own plan (A4).
- **Design:** brief and style from Qloo signals (taste trail, style words, moodboard), three plans ranked for how
  you live with trade-offs, 3D walkthrough, budget by room and market (eight markets, local currency), greenery
  and timeline, shopping list with Qloo brands and local stores.
- **Make changes:** instant edits (tap a room or type), versions with undo; plan, 3D, budget and shopping list
  follow. Save leads back to the walkthrough.
- **Share & export:** hand-drawn sketches, floor plans, details, PDF pack, DXF, walkthrough video; Arcon
  watermark on every download.
- **Accounts (part 1):** email and password, Google (live), Apple (button ready, needs a paid Apple developer
  account). Role at sign-up (homeowner, business owner, architect, builder) and a short profile; logos for studios
  and builders. Guest projects move into the account. /home and /account. Email confirmation is off (Vicky, 12 Oct).
- **Teams (part 2):** roles owner, architect, client, builder, viewer, checked on every project route. "Team on
  this project" in the profile menu: invite links with QR codes, one use, 7 days. Join page. Others see the
  owner's name ("Vicky's design", "Vicky's style").

## Next: one app, different for each person (planned 13 Oct, private/plan.md)

R1 is built (13 Oct): My projects for everyone, the project home with tabs, the guided steps only the first time,
per-project unlocking with pros' trials. R2 is built too: the project thread with room tags, files, events,
review and approval inside it, and the bell. R3 is built (14 Oct): New client (together or by link), the
pros directory by Qloo taste match with requests, fees by milestone, studio branding and handing over.
R4 is built and browser tested (14 Oct): the building site in full. The Site tab now shows on every project
with the three steps to get building, and an owner can manage the build themselves. The client sees the builder's budget, not the
builder's costs (15 Oct).
Next: R5, pricing with PayPal sandbox; the judges' demo is brainstormed first.

Vicky found the shared flow confusing, so the app now behaves differently for each person. Decided 13 Oct
(full list in private/plan.md, "One app, different for each person" and "Decisions from the 13 Oct grilling"):
- Sign-up asks the main role. Every project a person is on shows under My projects with their role on it; pros
  get a tool strip on top (architects: stages, requests, payments; builders: today on site).
- Pricing: home project $149, business $299 (one time); Studio $99/mo or $990/yr; Build $299/mo or $2,990/yr;
  14-day trial for pros from sign-up. Free before unlocking: style, 3 plans, 3D from outside.
- Project page: guided steps the first time, then a project home with tabs for each role.
- Project thread instead of comments: everyone on the project, room tags, events, photos and files, review and
  approval inside it, a Team-only channel for pros; the bell for notifications.
- "Do you have an architect or builder?": invite by link or QR, or Arcon suggests pros by Qloo taste match.
- Fees tracked by milestone (billed, "I've paid", received). Builders can design and build.

Build order: R1 role spaces and project home, R2 thread, R3 Studio and pros directory, R4 Sites (full tracking),
R5 pricing with PayPal sandbox (judges' demo brainstormed separately), R6 phone app. Then D3, E2, Q7, Q10, F1,
C2b photoreal (28 to 29 Oct), F2 and submission.

Everything here is open to change: if something can be better we brainstorm it and update the plan.

## Known issues

- Some 3D details Vicky flagged are still to revisit (task: leftovers from the 3D review).
- Test projects and test accounts (arcon.test.*@example.com) live in Supabase; cleanup script pending (F1).
- Google's sign-in page names the Supabase address, not "Arcon"; changing it needs Supabase's paid custom domain.
- The project page still has two old lint errors about state set in effects (not new).

## Waiting on

- Vicky: PayPal sandbox keys (for part 6). Apple developer account only if Apple sign-in is wanted.
- Final model choice around 20 to 25 Oct. Gemini free quota limits the design step.

## Testing notes

- Test accounts: `node --env-file=.env.local scripts/test-users.ts <role> [redirect]` prints a sign-in link;
  the test password is in `.env.local` only.
- `scripts/copy-project.ts` copies a finished project to a test account; `scripts/release-test-projects.ts` and
  `scripts/guest-link.ts` hand claimed guest projects back.
