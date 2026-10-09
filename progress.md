# Progress log

One entry per working session, newest at the top. Date, what got done, what broke, what is next.

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
