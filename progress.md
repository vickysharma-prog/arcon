# Arcon build log

Arcon was built from scratch during the Qloo Agentic Hackathon, from 9 to 30 October 2026, by one person. This is the
log of that build, one entry per day, newest first: what was built, how Qloo's taste database drives it, and how each
piece was checked. Every day ends with the unit tests passing, a clean type check and build, and a deploy to
[arcon-ten.vercel.app](https://arcon-ten.vercel.app), with live checks run against the deployed site.

**Qloo through the build:** the taste engine on day one (places, brands and culture, weighted into one style); every
choice credited to the Qloo signal behind it (12 Oct); a deep dive into Qloo's tag families, audiences and locations
that put Qloo behind ten design decisions (12 Oct); the moodboard, budget level, greenery, shopping list and plan
ranking from Qloo (13 to 14 Oct); the neighbourhood read with Qloo heatmaps and audiences for businesses (15 Oct);
room moods and light, art and a playlist from Qloo (16 Oct); a live Qloo strip and the taste quiz on the landing page
(16 Oct); a café's lighting and night look from its taste (24 Oct).

---

## 25 October: submitted

- **Submitted to the Qloo Agentic Hackathon on Devpost:** the story of the build in five phases, the vision, the
  problem with its sources, Qloo as the taste engine behind every decision, four diagrams (Qloo at the core, the flow,
  the agents, one project for every person) and a gallery of 15 screens.
- **For judges:** the README now links straight to the guided tour at
  [arcon-ten.vercel.app/demo](https://arcon-ten.vercel.app/demo), and names Qloo as the taste engine at the top of
  its Qloo section.
- **Checked as a judge would:** the landing page, the tour's 12 stops end to end on the live site, every link on the
  submission, and the repo (414 tests passing, a clean type check).

## 24 October: the judges' tour, the café by night, every device

- **A guided tour for judges:** 12 stops in three chapters (Maya designs her home; her architect and builder; not only
  homes), a thank-you page, then "Try it yourself" with every feature open. One screen between stops says whose view
  comes next ("Now you're seeing it as Lena Ortiz, the architect"). A short guide appears twice: on the interview and
  when the app first opens. Back, Next, the arrow keys and a list of every stop to jump to.
- **Sam's café, designed for its crowd:** the counter and back bar along the back wall and tables for two filling the
  floor (10 tables, up from 6). By night: a coloured glass pendant over every table, opal globes along the counter, a
  neon cup on the back bar, an LED cove running from rose to teal, soft bloom, and a lit sign over the door. The tour
  shows the whole café first, then opens it.
- **The 3D walk:** a brisker pace and a chip for every room to jump straight to it; wall panelling now stops at every
  doorway, on walls running either way (covered by a test over every template's plans).
- **Sketches for the builder:** clean hand-drawn lines with more room around each room close-up.
- **Every device:** the whole tour checked at phone width on the live site; the walk's controls, the guide and the
  style heading fit a phone.
- **Checked end to end on live, as a judge:** the full tour, then a fresh interview to a real design (Austin house,
  "Modern Industrial Eclectic", read by Qloo from Ace Hotel New York, West Elm and The Grand Budapest Hotel), its
  plans, budget and a change by chat ("Add a study"). Next.js updated to 16.4.3.
- 414 unit tests, every live check passing.

## 23 October: 3D quality

- Outside from taste: warm render for classic taste, roofs in their real material (slate, standing-seam metal,
  membrane), an entrance with a canopy, lights, a step, a stone path and shrubs, a nameplate by the door.
- Inside: modern-classic furniture (slim tapered legs, track arms, upholstered dining chairs), oak floors, panelling
  below a rail in classic rooms, one plant in three kinds per living room or bedroom, eight kinds of print so no two
  frames match, each room's feature wall in its own shade.
- Look around opens from the street side with every room named; the judges' tour shows each of these moments.
- Review words that describe a complaint ("stuffy") never become style words.

## 22 October: the judges' demo, a new typeface

- **A demo world built through the real app:** Lena Ortiz's architecture studio in Los Angeles with three clients (Maya
  Reyes's house on site at 75% with an accepted $990K quote, the Parks' house in review, Ana Silva's apartment in its
  last week), Mike Dawson the builder, and Sam Okafor's Brooklyn café. View only, so every judge sees the same world.
- Maya's interview replays itself at 1x or 2x, with Qloo reading her three picks live.
- New type: Funnel Display, Funnel Sans and Martian Mono. FAQ as cards beside a contact card; a footer.
- A deploy no longer leaves an open page waiting on code that moved (it reloads once).

## 17 October: quotes and fees, the film, the playlist

- **The builder's quote:** the builder sends a price; whoever approves the design accepts it, and it becomes the site's
  budget. A builder's fee splits by the site's own phases, each billed when its phase finishes, with a reminder.
- **The architect on site:** site visits logged in the thread, and "Sign off this stage" on finished phases.
- **For pros:** an AI design partner and the software to run every project, shown capability by capability on a live
  screen, for architects and builders.
- **A one-minute film** of the app from every side, recorded by script and played on the landing page.
- **The playlist** leans to well-known artists heard where the client lives.
- **Taste picks** are famous names with a clear look each, checked in Qloo; matched brands prefer ones people know;
  "places that share your look" leave out budget chains and campsites.
- City check in the interview against OpenStreetMap ("Delih" asks again); materials in sq ft and pounds on US sites.
- A model comparison on the real design pipeline across three projects: every run passed the schema with zero invented
  credits, three plans every time.
- README in full: architecture, the design pipeline, the project lifecycle, the data model, the engines, security,
  testing and setup. Lint clean.

## 16 October: one app for every role, from sign-up to the keys

- **A home for each role:** a status line, "Waiting on you" (reviews, changes asked, fees, late work, messages), plans
  that draw themselves on every card. My spaces for owners, Studio for architects (clients by stage, fees), Sites for
  builders (today on every site). One Owner role for homes and businesses.
- **The app frame:** a sidebar with the role's tools and every project, folding to an icon rail (Ctrl+B); Ctrl+K search
  across projects and their parts; a notification bell; a fee ledger, crew and wages, materials and deliveries, and
  site money for whoever runs sites.
- **Change requests after approval:** a change shows what changed and its cost difference and waits for approval;
  declined, the design returns to the approved version. In-person answers recorded as the client's own.
- **Moving in:** a snag list (anyone lists, the site fixes, the client signs off), a handover pack with warranty, the
  client's acceptance, then reviews of each pro, shown as stars on their profile.
- **Room moods and light from Qloo:** each room takes its mood from the ambience of the places the client loves (a
  bedroom calm, a kitchen bright), lit at 2700K, 3000K or 4000K; the walk says so ("Mood, read by Qloo: Clean, from
  Ace Hotel").
- **Art and sound from Qloo:** galleries near the site ranked for the client's taste, and a playlist of artists Qloo
  matches to what they love.
- **The exterior from taste:** roof shape, cladding and garden chosen from the style, the same in the 3D and the
  drawings. Day and night in the walkthrough.
- **The taste quiz** at /quiz: three rounds of pictures, a style card read by Qloo, shareable by link.
- **The interview's flow:** the questions first, then "Now let's find your style", three picture picks, the reveal, and
  one click into the design.
- **The landing page:** a 3D film of a home drawn as a sketch, then in colour, then at night; a live Qloo strip (The
  Grand Budapest Hotel and Aman Tokyo, Frank Ocean and Blue Bottle Coffee, Succession and Soho House, each read by
  Qloo); the market with its sources; pricing; questions.
- **Resources**, deleting a project or an account, an email check at sign-up, and Arcon as an installable app on phone
  and desktop with an offline page.
- Every journey traced end to end in the browser (owner alone; owner with architect and builder; finding a pro; a
  client going straight to an architect; builder design-and-build), each step checked over the API as each role.

## 15 October: the neighbourhood read, the drawings pack, a fast interview

- **The neighbourhood read for businesses, by Qloo:** the site placed on OpenStreetMap, then the same kind of place
  around it ranked by Qloo for the owner's taste, with photo, match and look; the crowd switch (everyone, under 25,
  36 to 55, over 55) re-ranks with Qloo's age signal; the city's Qloo taste heatmap ranks the site's area; how the café
  they love runs (takeout, table service, outdoor seating) read from its Qloo tags, beside their own answer.
- **The drawings pack:** dimensioned plans with tagged doors and windows, the four elevations, a door and window
  schedule, as a PDF and a DXF for CAD, all from the same design as the 3D.
- **Share and export:** hand-drawn sketches of the design drawn in the browser, a PDF pack, and the walkthrough recorded
  to video.
- **Make it yours:** edits to the chosen plan in plain words, in English, Hindi and Hinglish ("make the kitchen
  bigger", "pooja room chahiye"); plain rules read most requests instantly and a model call maps the rest to the
  same changes. The layout engine keeps every other room where it was: 87% of resizes succeed with a median
  disturbance of 0.07, the slowest in 78 ms. Every edit is a saved version with Undo.
- **"Let's get to know you":** the interview as a fast script, one question at a time, answers to tap, voice in and out,
  with places, brands and films matched in Qloo as people type.
- The builder's costs stay with the builder: the server leaves day rates and spend out for everyone else.
- Live checks after every push, run against the deployed site as each role.

## 14 October: the building site, cost tables for eight markets, the shopping list

- **The building site:** phases from the design's timeline with real dates, materials taken off the approved plan with
  quantities, tasks, a crew roster with attendance and labour cost, orders and stock, photo updates posted to the
  thread, alerts (late phases, overdue tasks, low stock, nobody on site), and money against the budget. An owner can
  run their own build.
- **Arcon's cost database:** building and finishing rates for the US, UK, Canada, Australia, Germany, UAE, Singapore and
  India, in local currency, six trades at four finish levels, each market from its published 2025 to 2026 guides,
  with regional factors; checked against published whole-home figures.
- **The shopping list from Qloo:** every piece the 3D places goes to a brand in the client's taste that makes it (read
  from the brand's Qloo product tags), near their price level, with a cheaper and a dearer alternative from Qloo's
  competitor and similar-brand tags, and furniture stores near the site ranked for their taste. Click any piece in the
  3D to see its brand.
- **Studio tools:** finding a pro by taste (the client's Qloo style against the styles of each pro's past projects),
  fees by milestone, studio branding on the client's project and PDF, handing a project over to an architect.
- The interview, redesigned as the first impression: a live progress rail, English, Hindi and Hinglish, a spoken
  greeting, a voice mode, and answers to tap.

## 13 October: budget, greenery, moodboard, the project thread

- **Budget from Qloo:** the chosen plan costed by trade and by room as a range, in the site's currency; the finish level
  opens at the price of what they love, read from Qloo (hotel class, a place's price level, a brand's price tier),
  with the reason shown.
- **Timeline and greenery:** phases from design to handover sized by area and scope; a greenery score from 0 to 100 with
  plants matched to each room's light, and suggestions that change the design when ticked. From Qloo: the
  sustainability work of brands in their taste and plant nurseries near the site ranked for it.
- **The moodboard from Qloo:** real photos of what they love, places elsewhere that share their decor (found with their
  own Qloo decor tags plus their taste), and matched brands, each captioned with why it's there.
- **The project thread:** one chat for everyone on a project, messages about a room, photos and files, events posted
  automatically, and review and approval inside the thread.
- **Each person's space:** My projects with roles and stages, a project home with tabs, a Studio for architects with
  "New client" in person or by link.
- A motion pass: sections that rise into view, numbers that count up, a greenery ring that fills, sounds on every step.

## 12 October: Qloo behind every decision, accounts and teams, plans from your own drawing

- **The Qloo deep dive:** about 40 live calls into tag families, audiences, demographics, entity look-ups, images, price
  levels and local places. The result is a plan that puts Qloo behind every design decision it can inform, shown so
  plainly that no one has to be told: style, moodboard, budget level, shopping list, greenery, room moods, the
  neighbourhood, art and sound, and a taste trail.
- **The taste trail:** every colour, material and light says what it came from; a brand Qloo matched is credited as
  "matched to Interstellar", never as something the user said; "Where your style came from" lists each love and what
  it gave, with match strength.
- **Picks checked in Qloo:** each taste question searches only its own kind (place; brand; film, show, artist or album)
  with Qloo's type filter and confirms the match by name before it counts.
- **How a business runs:** cafés, offices, shops and hotels get their own questions (dine-in or takeaway, seats,
  headcount, visitors, fitting rooms), and the answers size the programme and rank the plans.
- **Bring your own plan:** upload a floor plan; Gemini reads the rooms in a read-check-retry loop, code snaps it into a
  valid layout, and the person checks it before Qloo styles it.
- **Accounts and teams:** email and password, Google or Apple; a role and a short profile; guest projects carried into
  the account; roles on every project (owner, architect, client, builder, viewer) checked on every route; invite
  links with QR codes.

## 11 October: plans picked for how people live, and an architect's rules

- **Four layout concepts** (central hall to the street or the garden, an open great room, a split plan), with a "how you
  live in it" interview step, a ranking that quotes the person's own words and their Qloo loves, and honest trade-offs
  on each card.
- **An architect's rules in code:** a U stair in its own stairwell, no bedroom opening off the kitchen, minimum room
  sizes, doors near corners, furniture only on solid wall and never across a window or a doorway, essentials in every
  room. A fuzz test runs 600 random programmes on every test run; on 400 random homes, 87% get three plans.
- **The walk** follows a route through doors that a test proves never crosses a wall.

## 9 October: day one

- Tested the Qloo API live and designed the product around it: places carry decor and ambience, brands carry design
  tags, culture reaches home brands through Qloo Insights.
- **The layout engine** for seven space types, tested on all of them.
- **The Qloo client and taste engine:** three layers (places, brands, culture) weighted so that what the person named
  leads; every Qloo response cached in the project database, so a question is asked once.
- **The interviewer agent** on the eve framework with its tools and 13 evals (prompt injection, off-topic requests,
  ambiguous names, unknown places).
- **A realistic 3D model styled from Qloo taste:** furniture built from parts in one of six styles chosen by the taste
  profile, open-plan living, walls cut like a section to look around, and walking inside at eye height.
- Supabase connected, the Next.js app scaffolded, the first deploy.
