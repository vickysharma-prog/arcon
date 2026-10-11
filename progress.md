# Progress log

One entry per working session, newest at the top. Date, what got done, what broke, what is next.

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
