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

## Next (the seven-part plan, private/plan.md)

3. Review: share links, comments pinned to rooms, send for review, approve and lock the version, bell.
4. Studio for architects: clients by stage, "New client" in person or by link, studio branding.
5. Site tracking, full: phases, tasks, crew, attendance, materials and orders, photos, alerts, client progress.
6. Pricing: PayPal sandbox, plan limits, "Are you a judge? Click here" demo mode with showcase projects.
7. Phone app (PWA).

Then: D3 neighbourhood (Q8, Q9), E2 (taste quiz, exterior, day and night), Q7 and Q10, F1 quality,
C2b photoreal renders on about $10 of paid Gemini credit (28 to 29 Oct), F2 polish, video, README, submit.

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
