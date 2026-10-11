# Progress log

One entry per working session, newest at the top. Date, what got done, what broke, what is next.

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
