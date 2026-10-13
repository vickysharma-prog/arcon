# Progress log

One entry per working session, newest at the top. Date, what got done, what broke, what is next.

## 2026-10-14: R4, the building site (full)

- A Site tab once the design is approved. The builder (or the pro who owns the project) runs it; the owner, client
  and architect follow it read only.
- Start the site on a chosen day: phases come from the design's timeline with real dates (everything after
  design), and the main materials are taken off the approved plan with quantities and unit costs from the budget
  (flooring, paint, tiles, electrical and plumbing points, kitchen units, bathroom fittings, furniture, plants;
  cement and steel for a new build). The project moves to Building.
- Today: what needs attention (late or behind phases, overdue tasks, low stock for the phase in hand, nobody on
  site on a weekday), who is on site (tap to mark), tasks due.
- Phases and tasks: each phase's progress against where it should be by its dates; tasks with due dates and who
  does them; finishing a phase starts the next, and the last one finishes the build (status Done).
- Crew: the builder's roster is kept across sites (name, trade, phone, day rate); attendance by day; labour cost
  from the days worked.
- Materials: needed, ordered, delivered, used, still to order; orders with supplier, cost and arrival date, marked
  delivered once (stock adds up).
- Updates: a note and photos (the phone camera opens on mobile) and the phase's new %, shown to everyone and
  posted in the thread.
- Money: labour plus material orders against the budget.
- The client's Overview shows a Building card (%, what is happening now, the latest update and photo); the builder's
  My projects shows Today on site for every active site.

Tested: 300 unit tests (phase seeding, materials take-off, expected progress, alerts including weekends, stock,
labour); the site started and read against the real database on the test Austin house (7 phases, 9 materials,
USD budget, the "nobody on site" alert); production build.

Browser test on localhost as the builder: set a phase to 40%, added a task and moved it to Doing, added a tiler
and marked him on site (labour $120, the alert cleared), ordered the flooring and marked it delivered (218 on site,
spend $14,944), posted an update with a photo (phase to 60%, built 6%). As the client: everything read only, the
update and photo in Updates and in the thread, and the server refuses a client's change (403).

Fixed from the test:
- My projects counted "on site today" by the server's UTC day, so early morning in India it showed 0. The browser
  now keeps its time zone in a cookie and the server works out the person's own day (with a test).
- The budget, greenery and export tables gave rooms that repeat on each floor (stairs, hall) the same key, which
  React warned about.
- Supabase warned that one public table had row-level security off. It was `_migrations` (only the names of the
  migration files, created by the migrate script). RLS is on now, and the migrate script switches it on itself.
  Checked: every public table has RLS, and the public key reads nothing from `_migrations` or `projects`.

## 2026-10-14: R3d, studio branding and handing over; the techy pass

- The studio behind a design (the architect on it, or the pro who owns it) shows to its clients: "Designed with
  Test Studio" and its logo in the project header, its logo on the invite page, and on the PDF pack's cover
  ("Test Studio · design pack") and footer ("Designed by Test Studio · Made with Arcon").
- "Hand over" in the Team panel (owner, next to their architect, asks once more): the architect becomes the owner
  and runs the project from their studio, the owner stays on as the client, the design keeps their name, and the
  thread says so.
- The techy rule applied to the new screens: page loads show the scan line with the processing sound (one shared
  PageLoading), the thread and team load the same way, and headings decode in (sign in, profile, My projects,
  invite).

Tested locally: Test Studio's branding on the owner's project, the hand over (owner becomes client, mode pro,
editing refused, event in the thread, "You're the client" on My projects), the PDF cover and footer text.
294 tests pass. R3 is done.

## 2026-10-14: R3c, fees by milestone

- A Fees card on Overview for the pro and the person paying (hidden for viewers). The pro sets out one total fee
  and Arcon splits it: design 30%, approval of the final design 40%, handover 30%, in the local currency.
- Each milestone goes Planned, Billed (the pro), Paid to confirm ("I've paid", the client), Received (the pro
  confirms; a pro can also confirm a payment that came in before the client said so). Each step is checked against
  who is asking and where the milestone is, posts in the thread, and the card shows how much has come in.
- A pro's own client projects open on the project home, and only ask "Who will build this?".

Tested locally on Priya's house: the architect sets out ₹2,50,000 (₹75,000 / ₹1,00,000 / ₹75,000) and bills
Design; Priya marks it paid (and can't bill); the architect confirms; "₹75,000 of ₹2,50,000 received"; all three
steps in the thread. 294 tests pass.

## 2026-10-14: R3b, finding a pro by taste

- "Who will design and build this with you?" on Overview for an owner without an architect (then a builder):
  invite your own (Team), let Arcon suggest someone, or not yet.
- Suggest someone (/pros): architects or builders on Arcon with a live plan or trial and a city, ranked by taste
  match: the client's Qloo style tags against the tags of every project the pro has designed on Arcon (cosine
  similarity as a percentage), with the words they share ("You both love vintage, unique, artistic"), their past
  styles, about, fees and project count; the same city counts a little. Each pro has a public page (/pros/id).
- Asking a pro sends a request with an optional note; the pro sees it under New client requests, can view the
  design read only, and accepts (joins with the role asked, posted in the thread, the client is told) or declines.
  Accepting needs a live plan or trial.
- Pros add "About your work", fees, and "Suggest me to new clients" in Account.

Tested locally: the test owner's card, the directory (Test Studio, 90% match, shared words), a request with a note,
the architect's request card, read-only view before accepting (edits refused), accept (joined, thread event,
request cleared), and a builder declining from the button. 289 tests pass.

## 2026-10-13: R3a, New client (Studio)

- Architects and builders get "+ New client" on My projects: the client's name, the kind of project and the
  city. The project belongs to the pro (their plan or trial carries it) and is named for the client ("Priya's
  house", "Priya's design" everywhere). Then either "Fill it in together now" (Let's get to know you opens for
  that project) or "Send them a link" (a client invite with a QR code).
- The client signs up through the link, joins, and lands straight on Let's get to know you with "For Priya's
  design"; the type and city are already answered. Their answers fill the pro's project instead of making a new
  one, and a second submission is refused. They can start the first design themselves.
- A project still waiting for answers shows "Waiting for Priya's answers" with both buttons.
- Fixed: after designing or choosing a plan the page forgot who was looking (a client saw the owner's steps).
- Rule saved (Vicky): every screen, button and loader gets the techy sound and animation.

Tested locally: the test architect (trial) adds Priya by link, sees the waiting screen; a new test account joins,
lands on the questions with the badge and type and city filled, submits a full answer set into the same project,
starts the design, and sees "Priya's design, You're the client" with the budget open through the pro's trial.
284 tests pass.

## 2026-10-13: R2, the project thread

- Every project has a Thread tab (and a Thread card on Overview, with the unread count): one chat for everyone
  on the project. A message can be about a room, picked on the plan (⌂) or with "Discuss this room" in the 3D;
  "Rooms talked about" filters by room. Photos and files up to 10 MB, stored privately and shown through signed
  links. Pros get a "Team only" channel when the project has two or more pros.
- The project's own events post themselves: a plan chosen, a change saved (with its version and note), someone
  joining, sent for review, approved or changes asked.
- Review happens in the thread: the architect (or the owner) presses "Send for review"; the client gets a card
  with a note box, Approve and Ask for changes. When a project has clients only they answer; otherwise the owner
  does. Approval locks that version ("Version 1 approved by Priya"); any later change moves the project back to
  Design and needs approving again.
- The bell in the header lists what happened on your projects and opens the thread.
- The unused comments table is replaced by messages (migration 009).

Tested locally with the test owner and client: tag the kitchen, post, send for review (stage moves to Review),
the client's bell shows all three, the client approves with a note (stage Approved, approval line and event in
the thread), a photo shared from the browser and through the API, a file from another project refused.
282 tests pass.

## 2026-10-13: R1, each person's space and the project home

- My projects for everyone: every project a person is on, each labelled with their role on it ("Your house",
  "You're the architect"). Homeowners and business owners get large cards with the progress strip; architects
  and builders get a tool strip on top with their plan or trial days left and projects by stage.
- Project home: once the guided steps are done (the creator reaches Share & export, or presses "Go to project
  home"), a project opens on its home: whose design, a progress bar (Know you, Design, Review, Approved,
  Building, Moved in), a "Next" line for this person, and tabs: Overview, Design (style, plans, 3D, Make
  changes), Budget & shopping, Files. The tabs show the same screens as the guided tour. "Take the guided tour
  again" brings the steps back. Others on the project always land on the home.
- Unlocking: a new project is a preview (style, plans, 3D looked at from outside). Unlocking ($149 for a home,
  $299 for a business) opens walking inside, budget, shopping, Make changes, files and invites. The server
  refuses those routes for a locked project; a pro's live plan or trial unlocks their projects; every project
  made before today stays unlocked. The Unlock button is free until PayPal checkout (R5) and says so.
- Pros get a 14-day trial when they sign up as an architect or builder.
- Fixed a crash: leaving the 3D while a tab or step animated out broke its room labels; the 3D now leaves at once.

Tested locally with the test owner: My projects, a locked project (budget and shopping refused, 3D only from
outside), Unlock (budget opens), tabs, 3D and back with no errors. 279 tests pass.

## 2026-10-13: Planning the app around each person

Vicky stopped the review work (part 3) because the flow felt the same for everyone. We planned and grilled the
whole product around roles: who signs up as what, what each person sees, what they pay, how pros are found, the
project thread, approvals, fees, and lapsed plans. Every decision is in private/plan.md ("One app, different for
each person" and "Decisions from the 13 Oct grilling"); the judges' demo is parked for its own brainstorm.
Decisions stay open to change.

Database changes made today (applied, nothing else built yet): migration 007 (comments, approvals, events, wider
project status; the comments table will be replaced by the thread) and 008 (unlocked_at, toured_at,
designed_for on projects, every existing project kept unlocked; trial_until and demo on profiles).

## 2026-10-16: Roles and invites (part 2)

- Each project has a team: the owner plus an architect, client, builder or viewers. One table (lib/project/access.ts)
  says what each role may do, and every project route checks it: viewing routes need "view", design changes need
  "edit". A client or viewer can look but can't choose a plan, make changes or invite; their project page hides
  "Make changes".
- The Team button on every project opens a panel: who is on it, and "Invite someone" with a role, a link and a
  QR code. Each link works once, for 7 days, and can be cancelled. The owner can remove people.
- The invite link opens a "You're invited" page naming the project, who sent it and the role. People without an
  account create one (or sign in) and come straight back to join.
- Home lists projects you were invited to, with "You're the client" (or architect, builder).
- A signed-out visitor to a project sees "This project is private" with a sign-in button.
- Vicky's review: everyone else on a project sees whose design it is ("Vicky's design, designed around Vicky's
  taste", "Vicky's style"), on the project, the invite page and their home. The Team panel moved into the profile
  menu ("Team on this project") so the plan flow stays clean. A GIF of invite and join is in Downloads.

Tested on localhost with test owner and client accounts: invite link and QR, the join page signed out, sign up,
profile, join, the client's view (200), and choose, edit and invite refused (404) for the client; the owner sees
the client in the team; the used link isn't listed as waiting. 273 tests pass.

## 2026-10-16: Accounts (part 1 of the accounts, studio, site and pricing plan)

Vicky asked to plan the rest of the product before building more. The plan (private/plan.md, "Accounts, studio,
site and pricing") has seven parts: accounts, roles and invites, review, studio, full site tracking, PayPal plans
with a judges' button, and the phone app. Photoreal renders move to the end, on a small paid credit.

Part 1 is built:
- Sign in or create an account with email and password (Vicky's call), Google or Apple. Forgot password sends a
  reset link. Google and Apple show a friendly message until their keys are added in Supabase.
- New accounts pick a role (homeowner, business owner, architect, builder), then a short profile for it. Architects
  and builders add a studio or company name and a logo; builders add crew size and trades.
- Projects started as a guest move into the account at sign-in. A project that already has an owner is never taken.
- /home lists your projects ("My projects", "Studio" or "Sites" by role); /account edits the profile.
- Routes now accept the signed-in user as well as the guest cookie. The user cookie is signed under its own label,
  so a guest cookie can't pass as a user. Sign-in only accepts requests from Arcon's own pages.

- Once an account owns a project, only that account opens it; the old guest cookie no longer does, and sign-out
  clears the guest cookie too. Checked: a project opens signed in (200) and not after sign-out (404).

Tested locally with test accounts: email link, password sign-in (wrong and weak password messages), reset password
from the email link, owner and architect profiles (studio name required, logo upload), home, account, sign out.
Not tested: the "check your email" step after a new sign-up, because confirmation emails can't go to test
addresses. 269 tests pass.

Waiting on Vicky: Supabase URL settings, Google keys, Apple developer account (paid), PayPal sandbox keys.

## 2026-10-15: Share & export, and the walkthrough video (D2 and the video half of C2)

Vicky: after the changes loop there has to be a way out, with designs people can share. The last step is now "Share
& export", after "Make changes", and the note after saving changes links to it. It draws hand-drawn sketches of the
design in the browser (each floor from above with the walls cut, the other side, close-ups of the two biggest rooms
with their furniture, the street), framed to fit whatever the size, on white at twice the screen's resolution with
the line weight scaled to match. Each downloads as a PNG; Share sends them from the phone or computer. A PDF pack
(cover with style and Qloo taste words, sketches, a plan per floor, the room list, the budget by trade) prints from
the browser's own Save as PDF. A DXF of the plan (rooms, names, areas, doors, windows, a layer each) opens in CAD.
The walkthrough has "Download video": the walk restarts and the browser records the 3D canvas to an MP4 (WebM where
MP4 isn't supported) that saves when the walk ends.

## 2026-10-15: C1, the workspace ("Make it yours")

Edits to the chosen plan, all instant. Tap a room on the plan for Bigger, Smaller, Rename or Remove; add a room;
open or close the kitchen; or type what you want ("make the kitchen bigger", "pooja room chahiye", "laundry hatao").
Plain rules read most requests in English, Hindi and Hinglish; only what they can't read goes to one model call that
maps it to the same changes. Each edit reads the rooms back out of the plan, changes them and lays them out again
with the same concept, so every architect rule still holds; the browser shows the result at once and the server
works it out again and saves it as a version, with Undo. The plan, 3D, budget, timeline and green score follow.

Making edits feel like edits took engine work: the layout engine can now score every valid arrangement and keep the
one closest to the current plan, and rooms in an open band keep their row, so a bigger kitchen no longer swaps the
seating area across the café. Across every room of every template, 87% of resizes succeed (the rest say plainly
why), the median disturbance to other rooms is 0.07, and the slowest edit takes 78 ms.

Then, from Vicky's review: the kitchen switch shows only for homes and cafés, named after the room. Adding a room
tries a few placements and keeps the least disruptive (every add now succeeds; median disturbance 0.15, from 0.19).
The model fallback was slow because the lite model went first; it now leads with a full model, falls through to the
next one on "high demand" as well as quota, and gives up after 8 s with suggestions. The instant rules read far more
phrasing ("somewhere to do yoga", "the kids need more space", "aur jagah chahiye"), so the model is rarely needed.
"Save & walk through it" takes you to the walkthrough of the changed design, with a note that the budget and
shopping list are updated too.

## 2026-10-15: "Let's get to know you" replaces the AI interview

Vicky: the interview was slow and irritating, the first thing a user sees. It is now a fixed script
(lib/interview/script.ts) with no model in the loop: one question at a time in the centre of the screen, answers to
tap (keys 1 to 9 work), typing only where it is needed, English, Hindi and Hinglish, voice in and out. Each next
question appears at once. The place, brand and film questions are matched in Qloo as people type, two optional
extras (music, a trip) add to the taste, and the taste card fills in live. The finish route checks every answer
against the script, confirms the picks with Qloo again and creates the project in the shape the design step reads;
the AI runs only after, on the brief, program and plans. Tested end to end on localhost: a house in English (project
in 3.6 s, then the full design) and a café in Hinglish (project in 1.8 s, nothing missing for design).

## 2026-10-15 (early morning): The hero becomes a hand-drawn sketch

Vicky asked for the 3D model as an architect's hand drawing in the site's ink and blue. The scene now has a sketch
look: it is drawn with surface directions as colours, and a shader turns sharp changes in direction or depth into
wobbly ink lines with a lighter second stroke, hatches shaded sides in blue, and reveals the drawing with a pen
sweep. It follows light and dark mode. In the hero it sits straight on the page with no card: the empty space is
see-through, the edges fade, the camera circles and closes in on its own, floors switch while it is far out, and
the plan of the shown floor sits beside it. Tried crossing fact strips under the hero; Vicky found them loud, so
they are gone. The header turns to frosted glass on scroll, and the hero fits phone screens. Checked live in light,
dark and phone width with no console errors.

## 2026-10-14 (late night): The landing page

Vicky: the home page should open with the logo and a tech sound, explain what Arcon does, show pricing and a way
to sign up, and feel like an AI product. Built it: a logo intro (seeds grow, the name resolves, a scan line runs),
then a hero whose floor plan draws itself and lights each room with the taste behind it. Below that sit how it
works, a taste flow showing what you say, what Qloo reads and what Arcon designs, the features, who it's for,
pricing from the plan, and a closing call. The header is the logo on its own with the sections in a floating bar;
buttons glow, and a blue light follows the mouse. "Powered by Qloo" sits in the intro, hero and footer.

Browsers block sound until a click, so a first-time visitor taps to enter and that tap plays the boot sound;
anyone arriving from inside the app hears it at once. Sign up and every pricing button open the interview as a
guest until accounts land (D1). Checked at desktop and phone width: no sideways scroll, no console errors.

Later the same night, from Vicky's review: the intro now plays together with its sound from the tap (a faint
breathing mark waits with "Tap to enter"), and the Arcon logo in any header replays it. The hero shows a live 3D
sample home built by the layout engine, which turns slowly until grabbed, with its plan in the corner and a ground
and upper floor switch; wheel zoom is off so the page still scrolls. The cursor light is smaller and the taste flow
is wider, with more taste words.

## 2026-10-14 (night): Why the interview stalled after the first answer

Vicky: the live interview stopped after "A home". Ran it end to end on production and read the session stream.
Two causes. The production model was gemini-3.1-flash-lite, which sometimes writes its tool calls out as text
("tool_code print(default_api...)") instead of making them, so nothing was saved and no answer chips appeared.
And the free Gemini quota ran out after a day of evals, so turns failed with "You exceeded your current quota"
while the page showed nothing.

Fixed: the interviewer now leads with a full Gemini model and falls through the others when one is out of quota,
with lite models last. A failed or silent turn shows "Try again" in the user's language. The chat box keeps its
size and scrolls inside, and user bubbles fit their text.

Still open: every model on the key is out of quota tonight, so the full run to "See your design" waits for the
reset (midnight Pacific, 12:30pm IST) or billing on the Google key. Evals should use a separate key.

## 2026-10-14 (evening): The interview, redesigned as the first impression

Vicky: the interview is where people decide to stay, so it should feel alive and techy, speak English, Hindi and
Hinglish, greet out loud, put the floor-plan upload up front, and let people tap answers instead of typing.
- A live strip and a five-stage progress rail (project, people, how it's used, taste, design) that fills as the
  interviewer's tools run, never out of order.
- English / हिंदी / Hinglish: the greeting, the microphone language and the voice follow the choice; Devanagari is
  always read in Hindi; the interviewer replies in the language and script the user writes in (Hindi eval added).
- The greeting is spoken on arrival (the Start click allows the browser to speak).
- Talk to Arcon: the mic opens a voice mode with the Arcon mark, large and on its own, that swells with your voice
  (a live microphone level), turns while thinking and grows its seeds while speaking; after Arcon speaks it
  listens again, so a conversation flows without taps.
- Tap to answer: a new offer_choices tool gives every question its likely answers, shown as chips (multi-select
  with Done where several apply); questions only the user can answer show an example in the box instead. One
  question per turn. Starter chips for the first answer.
- Floor-plan card with a blueprint that draws itself, at the top of the side column.
- The logo appears on its own everywhere here, never on a circle or box (Vicky).
- set_project now takes the size as the user said it ("40 by 30 feet") and recovers a dropped depth or a wrong
  unit from those words; the evals check what is saved.

## 2026-10-14 (later): The interview crashed on the first message

Vicky: typing anything in the interview broke the page. Reproduced live ("This page couldn't load", TypeError
"i is not a function") and in dev ("destroy is not a function"): an effect written as an expression,
useEffect(() => el.scrollIntoView({ behavior: "smooth" })), returned what scrollIntoView returns. Newer Chrome
returns a promise from a smooth scroll, so React took it for a cleanup function and crashed when it ran. Our
code hadn't changed; the browser had. Both expression-bodied effects now use braces and return nothing. Checked
locally: the message sends and the interviewer replies.

## 2026-10-14: Real cost tables for every market and tier (B2b)

Vicky reminded me of the decision: research each target market's own prices, not scale US rates. The budget now
reads lib/budget/rates.ts: for the US, UK, Canada, Australia, Germany, UAE, Singapore and India, in local currency,
six trades (flooring, paint, wiring and lighting, kitchen, bathroom, new build per m2) at four tiers each, from
published 2025-26 guides that give budget, mid-range and high-end bands (Cost vs Value, Angi, HomeAdvisor,
Checkatrade, MyBuilder, HomeStars, Ontario builders, What's The Damage, DuoTax, AMK, MyHammer, VPB, Bayut, Knight
Frank, MoneySmart, Qanvast, EdgeProp, BeyondWalls, JK Cement and others). Every figure names its source in the code;
the few no guide covered are marked "derived". Regions move the price: US Northeast/West/Midwest/South (HomeGuide),
London/South East/North, Toronto-Vancouver-Calgary, Sydney, Munich, Mumbai/Delhi/Bengaluru/Pune. A new build's rate
now covers floors, wiring and baths instead of counting them twice. Checked against published whole-home figures:
a 2-bed flat comes to S$63k in Singapore (published S$40-80k), AED 216k in Dubai (AED 144-263k), about ₹1,300 per
sq ft in Pune (₹800-1,800). Furniture follows each market's retail level (India about 40% of US prices).

## 2026-10-14 (early): Shopping list, and click a 3D piece to see its brand (B4, Q5)

A new Shopping list step after the budget. It lists what the 3D actually places that you would buy (furniture,
lamps, rugs, plants, appliances; fitted kitchens and baths stay in the budget), counted with their rooms. Each
piece goes to a brand in their taste that makes it, read from the brand's Qloo product tags (Nourison: rugs;
Buster + Punch: lighting; Roche Bobois: sofas, beds), near their price tier, brands they named winning close
calls. A cheaper and a dearer alternative come from the brand's own competitor and similar-brand tags plus
other brands in their taste that make the piece. Rough prices per piece at their tier and in their currency;
furniture stores near the site ranked for their taste. Every brand and store opens a Google Maps search near
them. On Vicky's plan: bed from Ethan Allen ($$$, or IKEA $$, or Roche Bobois $$$$), rug from Nourison Home
(or Safavieh $$), sofa from IKEA (she loves it; or West Elm $$$); stores Home Centre and Nilkamal in Pune. The
first build takes about 15 s of Qloo look-ups, cached after. In the walkthrough, clicking any piece you can buy
opens a card with its brand, why, price and alternatives. 216 tests.
Vicky found brand links opening the wrong place: a Maps search for "Ethan Allen, Pune" lands on whatever Maps
guesses, since there is no Ethan Allen in Pune. Now each brand's store is checked: a place counts only if every
word of the brand is in its name and the city is in its address ("Ethan Allen Hwy" BBQ in Connecticut fails,
"West Elm Pune" passes). A checked store links to that store; otherwise the brand's official Instagram (Qloo
carries the handle; it has no websites); otherwise no link. The shopping list has the same tier picker as the
budget, shared between the two and the 3D card, and the tier now picks the brand: each piece goes to the brand
nearest the tier among those that make it and their rivals (essential and mid: IKEA beds and Safavieh rugs;
luxury: Roche Bobois and Poliform), with loved brands winning close calls. 218 tests.

## 2026-10-13 (night): Motion pass (M1)

Vicky: the style and budget pages looked like a plain dashboard. Added a small motion kit (components/fx/Motion):
sections that rise and sharpen into view as they scroll in, numbers that count up (the budget total, every
trade), a greenery ring that fills, bars and timeline phases that grow in turn, cards with blueprint corner marks
that close in on hover and a light scan line when they first show, and a scanning loader while Qloo is read.
The tier highlight slides between tiers; colour swatches lift on hover and copy their hex on click; style words
pop in one by one; moodboard photos zoom on hover; ticked greenery changes slide into place with a soft sound.
Everything shows its final state at once for reduced motion. Vicky's follow-ups, same night: the greenery checklist is
now compact (added changes fold into one line with Show and Undo all; three open suggestions, the rest behind
Show more; Add all applies them one after another so none clash); a leaf sways in the score ring and springs up
when the score changes; the blueprint corner marks are gone, replaced by light running along a card's edges on
hover; moving between steps plays a brighter sound (the old low whoosh sat below what laptop speakers play, and
a paused audio context dropped it) with a scan line sweeping down the screen; the budget total waits for the
taste tier instead of showing mid-range and jumping. Below-the-fold sections now animate when seen,
not on a timer. Checked live; Vicky's plan, with all eight greenery changes ticked, scores 100.

## 2026-10-13 (evening): Raise the greenery score, and it changes the design

Vicky: show ways to improve the score, let the user tick them, and change the plan so it means something.
The greenery card now lists changes with the points each adds (worked out by applying it and scoring again):
more plants in a room (floor spots first, then wall shelves above the furniture when the floor is full), a plant
that suits a room's light and is easy to keep, a new kind of plant, planting along the garden edge. Ticking saves
the change to the project and the walkthrough places the plants; unticking undoes exactly that change. Tested:
ticking every suggestion takes the house, apartment, café and office templates and Vicky's plan to 100, each tick
raising the score. A suggestion worth under a point is still offered (rounding had hidden the last ones). Every
nursery links to Google Maps. Local searches now step out from a neighbourhood to its city, because Qloo found no
nurseries for "Koregaon Park, Pune" but three for "Pune". Vicky's plan projects are set to Koregaon Park, Pune.

## 2026-10-13 (later): Timeline and greenery (B3, Q6)

The budget step now also shows how long and how green. Timeline: phases from design to handover (permits and
structure for a new build, strip-out for a fit-out; services, joinery, finishes, furniture, plants, handover),
sized by floor area and scope, with longer lead times for premium and luxury; about 14 weeks for Vicky's house
at premium. Greenery, 0 to 100: plants per room (the same plants the 3D places), how well the brief's plants
suit each room's daylight (window area against floor area), how many kinds, how easy to keep, plus garden on
the lot; a table of 27 common indoor plants with their light and care needs. Each weak room gets one tip, using
their own plants where they suit. From Qloo: the sustainability work of brands in their taste (IKEA: circular
design, recycled materials) and taste-ranked plant nurseries near the site. The brand filter now also requires
a home industry: a coffee roaster with a design shelf had slipped through. 206 tests.

## 2026-10-13: Budget (B2, Q4), and any project type parked (G1)

Budget step: the chosen plan costed by trade (floors and walls, electrical and lighting, kitchen, bathrooms,
furniture, plants, construction for new builds, 10% design and contingency) and by room, as a low-high range
(about 20% under to 25% over), in the site's market and currency: US, Canada, UK, Germany, Australia, UAE,
Singapore, India. Rates are US mid-tier from published 2025-26 ranges, scaled by market; checked against them
(a mid-range Pune house fit-out comes to about ₹1,000-1,550 per sq ft, inside the ₹800-1,800 published band).
The tier starts from the price of what they love, read from Qloo: hotel stars, a place's price level, a brand's
dollar signs (Ace Hotel is a 4-star hotel, IKEA is $$), with the reasons shown, and can be switched. Unknown
countries are flagged rather than silently priced as the US. 199 tests.
Checked live on Vicky's uploaded plan: it priced in dollars because the upload flow never asked where the
building is. The check screen now asks for the city (required), and the budget has a country picker that says
so when the location is unknown.

Vicky asked for any architecture project, not only the seven types. Started G1: ten new families (clinic,
school, gym, salon, gallery, restaurant, showroom, coworking, workshop, other) with templates, nine room kinds,
furniture, three new 3D models. The original seven were checked identical before and after (14 plan and
furniture hashes) and just as fast. Vicky then decided to finish the seven types properly first, so G1 is
parked on the branch g1-any-project; main is unchanged.

## 2026-10-13 (early): Moodboard (Q2)

Your style has a moodboard of real Qloo photos: what they love, then places elsewhere that share their decor
(found with their own decor tags plus their taste; without the decor filter Qloo returned airports and museums,
without the taste it returned generic famous hotels), then up to three matched brands (brand photos are often
logos, so they come last). Every photo says why it's there: "Shares your vintage, boutique look · Barcelona".
Taste building is now one shared function (profileFor) for the interviewer, plan upload and a new retaste
script, which re-ran Vicky's two projects with the new brand filter: it dropped an interior design app, an
architecture firm, two other service brands and a hair salon brand. 192 tests.

## 2026-10-12 (night, after the trail): Nothing in front of any door

Vicky's uploaded house: the kitchen counter and hob stood right in front of the door into the master bedroom,
which opens off the kitchen. Furniture only kept a room's own entrance clear, not the doors of rooms that open
off it. Now every doorway into a room is kept clear, and a piece that slides off one door can't land in front
of another. The door test now checks every doorway, on the templates, every concept and Vicky's plan; on the
old code it also caught a sofa across the kitchen door of the great-room plan.
Clearing every door left Vicky's kitchen (four doors: dining, master bedroom, closet, hall) with no wall long
enough for the counter, so it lost its kitchen. The counter now falls back to 2.4 m and then 1.8 m runs on each
wall. Checked on both of Vicky's saved projects: every plan has a counter (1.8 to 2.3 m) and no door is blocked.

## 2026-10-12 (night, last): Taste trail and style words (Q11, Q3)

Your style now shows where everything came from. Under the summary: the words the style is made of, each with
its source, taking turns between the things they love so one hotel can't fill the list. Every colour, material
and light says what it came from; a brand Qloo matched is credited as "Buster + Punch, matched to Interstellar",
never as something they love. At the bottom, "Where your style came from": each thing they love and what it gave
(Ace Hotel: vintage, artistic, moodily dark; IKEA: clean lines, natural wood tones; Interstellar: four brands,
with match strength), then a table of every choice and its source. The brief now builds the style name from the
strongest style words. Checked live on the Ace Hotel, IKEA and Interstellar project.
Found on the way: the matched brands included an interior design app and an architecture firm (service brands);
they are filtered out now, with clothing labels and magazines. 187 tests.

## 2026-10-12 (night, later): Qloo deep dive, and the Q plan

Vicky: Qloo should be behind every design decision it can inform, visibly. About 40 live calls explored what
we hadn't used: tag families, audiences, demographics, trending, entity look-ups, images, price levels, local
places. Best finds: brands carry price level, income level, age group, sustainability and competitor tags;
places carry price, hotel class, photos and how they run (takeout, table service); cafés near a real
neighbourhood come back with their decor for a given crowd. Dead ends: trending (empty), books (noisy),
culture straight to decor tags (generic). Pitfall: unfiltered brand search found a fashion label for "RH".
Findings in private/qloo-findings.md, the plan (Q2 to Q11, each decision, signal and where it shows) in
private/plan.md. About 100 of 10,000 Qloo calls used.

## 2026-10-12 (late night): How a business runs (A5)

Cafés, offices, shops and hotels now get their own "how you run it" step, like homes get "how you live".
Café: dine-in or takeaway, full kitchen or coffee and light prep, seats, outdoor seating. Office: headcount,
focused or together work, visitors. Shop: browse an open floor or show pieces to the street, fitting rooms.
Hotel: guest rooms on a floor (a lobby question was dropped: no hotel plan has a lobby, so the answer could not
change anything). The answers rank the plans with reasons in the user's words, size the program (1.4 m2 a
seat, 6 m2 a desk), and move an office's meeting room to the front when clients visit. Every reason is tested
against the layout it describes: the takeaway counter really is on the street, the focus office's desks and
quiet room really sit either side of reception.

Bugs found on the way: the open band put the biggest room in the shallowest row (a cafe's 50 m2 seating got a
3 m deep strip and the counter got 42 m2); rooms now go to whichever row keeps both rows near their share.
The interviewer dropped the depth from "40 by 60 feet" (old, unrelated, caught by evals); it leaked its tool
list to "ignore all previous instructions"; and it moved on when a café wasn't found. All fixed, with evals.
A count the model only quotes ("12 people") is still saved as 12. 181 tests. Evals: every tool gate passes;
the full run hit the free Gemini quota part way, so the judge stays on Flash-Lite with its own quota.

## 2026-10-12 (late): Taste questions on the check screen are checked, and all three are required

Vicky typed "marvels techy science fiction" for the film question and got a "Sophisticated Cabinet" style. The
cause: the confirm step took Qloo's first search result blindly, and for that phrase it was a bookstore (a
place, so it fed style tags). Now each question searches only its own kind (place; brand; film, show, artist
or album) using Qloo's type filter, keeps only matches whose name is what the user typed (75% of their words,
accents and endings ignored), and shows "We found: X (kind, address)" with other matches to switch to. A vague
answer gets "We couldn't find that. Name one film, show, artist or album by name, like Interstellar." Design
with my plan stays off until all three have a match, and the server looks each pick up again and rejects a
missing, wrong-kind or unknown one. Checked against live Qloo: Interstellar, Breaking Bad, Arijit Singh, IKEA,
Apple, Ace Hotel New York and Blue Tokai all match; the sci-fi phrase and "nice stuff" don't. 176 tests.

## 2026-10-12 (night): Vicky's own plan upload, and an agent loop for reading plans

Vicky uploaded a real 30 x 40 ft three-bedroom plan with no hall: bedrooms open off the family, dining and
kitchen space. The first version failed: every room got one door "to a hall first", so rooms formed islands
nobody could reach. Doors now grow outward from the front door the way a person walks in; bedrooms and baths
are never a way through; an open kitchen counts as living space. The reader now gives the main entrance's
position and the plan is turned so the entrance faces the street. Slight overlaps meet halfway; thin strips
are wall, not halls. Readings vary between runs, so reading is now a loop: read, check, and if rooms overlap
or leave holes, tell the model exactly what's wrong and read again (up to three times, keep the best).
Vicky's plan, re-read: 10 rooms, front door into the dining area, no problems. 171 tests.

## 2026-10-12 (evening): Bring your own plan (A4)

Upload a floor plan at /start/plan; Gemini reads the rooms (tested: a drawn apartment read correctly in 4 s);
snap joins edges, snaps drifting edges to the outside walls, folds thin strips into rooms, adds doors, windows
and a street-side front door. A real reading that drifted 50 cm broke the first version; it is now a regression
test. The Check your plan screen previews edits live, separates blocking problems from advice, and asks for a
few loves for Qloo. The Plans step then shows the user's plan plus two other layouts of the same rooms.
165+ tests passing. End-to-end run in Chrome: upload, check, design, plans, no page errors.

## 2026-10-11 to 12: Plans picked for how people live, and architect rules

Vicky's direction: the three plans must be chosen for the user from their interview and taste, not one plan
flipped three ways. Built the "how you live in it" interview step (homes only, typed tool, evals), four
layout concepts, a ranking that quotes the user's words and their Qloo loves, and trade-offs on each card.

Vicky then found basic mistakes in the 3D: rooms opening into the stairs, a missing dining table, a bookshelf
in the middle of the open plan, the walk repeating and passing through walls, a front door on the side, a
window over the front door. The checks had only covered geometry. Wrote the rules an architect would apply
into the validator and tests, rebuilt the stair as a U stair in its own stairwell, made furniture respect
walls and windows and never overlap, and replaced the walk with a route through doors that a test proves
never crosses a wall. Found and fixed more on the way: 5 m² bedrooms, a 2 m deep living room, a front door
into the kitchen, a powder room with a shower, Qloo-matched brands worded as things the user loves.

Checked that it is not only for homes: cafés, offices, shops and hotels now get business wording and café
seating gets small tables. Decided two new pieces of work: A4 (bring your own plan, skip the interview) and
A5 (a business version of the "how you live" step).

Tests: 149 passing; fuzz clean on 3,000 extra random programs. On 400 random homes, 87% get three plans.

## 2026-10-09 (night): Fixes from Vicky's testing, and the plan options problem

Vicky tested the live site and found three layout problems: the explore guide was cut off on short screens,
the 3D window was too short, and the Next bar wasted space. All three are fixed: the guide is compact and
scrolls, Next sits top right on every step, and the 3D view fills the screen. The style page said
"Industrial Bohemian" while the 3D said "Scandinavian"; the brief's style name now leads, so they always match.

Choosing another plan did change the 3D (checked in Chrome for all three options and all three modes). It
looked the same because Look around opened on the upstairs and the walk starts at the same door. Look around
now opens on the ground floor, and the header names the plan option.

The real finding: the three options are one layout idea flipped and mirrored. Decided with Vicky that the user
gets three plans picked for how they live, from a library of real layout concepts, each with a reason quoted
from their interview or Qloo taste. Designed today, built tomorrow.

## 2026-10-09 (evening): Realistic, taste-styled 3D and walking inside

Living, dining and kitchen areas now open into each other in both the plan and the 3D model. Furniture is drawn from parts: sofas with cushions, made beds, a full kitchen run with sink, hob, fridge and utensils, a TV, books, lamps and plants. The Qloo taste profile picks the furniture style (mid-century, industrial, Scandinavian, boho, classic or modern) and the viewer names the loves that chose it. The brief picks the feature wall finish, tile and art colours. Walls get art and curtains, and the floors get planks and tile. Ambient occlusion and soft light replace the flat look.

Look around frames the house, cuts the walls at 1.4 m like a section, and labels rooms you can fly to. Explore inside walks at eye height with keys, clicks and a mini-map, and the walls stop you. Tests caught a bed and an island that blocked the door swing; both now fall back to smaller pieces.

Next: click a piece to see its Qloo brand, a day and night toggle, a real exterior, then budget and drawings.

## 2026-10-09 (later): Foundations and the interviewer agent

Built the layout engine and tested it on all seven space types. The tests caught two real bugs: stairs that didn't line up between floors, and a narrow bathroom with no wall for a door. Both are fixed.

Built the Qloo client and the taste engine. Every Qloo response is cached in Supabase, so a repeat question costs no quota. A live check turned the Ace Hotel and Wes Anderson into vintage, moody and post-industrial, and Blue Bottle and Metallica into industrial and clean. An early version let many matched brands outweigh the places the user named; the weights now favour what the user said.

Connected Supabase through Vercel and added projects, versions and agent sessions with integration tests. Built the interviewer agent on eve with five tools, a plain-English voice and a signed guest cookie. On the live site the agent refuses requests without the cookie.

Wrote 13 evals for the interviewer, including prompt injection, off-topic requests, ambiguous names and unknown places. They also caught a real bug: Gemini rejects tool results that are bare lists. The free Gemini quota only allows a few runs, so evals now run one at a time.

Next: bind sessions from the web app, the interview screen with voice and text, and the designer agent.

## 2026-10-09: Planning and the first app

Tested the Qloo API live. Brands carry design tags, hotels and cafés carry decor and ambience tags, and explainability scores every pick. Settled every product decision: seven space types, a 12-step wizard, a workspace, owner and pro modes, and PayPal for payments. Chose the stack: Next.js 16, eve agents through AI Gateway, Vercel Workflow, Supabase and three.js.

Scaffolded the Next.js app with Arcon's warm architectural look. The build passes.

Next: the layout engine, the Qloo client and the first deploy.
