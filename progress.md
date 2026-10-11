# Progress log

One entry per working session, newest at the top. Date, what got done, what broke, what is next.

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
