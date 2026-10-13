# Arcon

An AI architect agent that designs a space around who you are. One interview turns your taste, site and budget into a floor plan, a 3D walkthrough, a budget and a timeline you can share with the people who will build it.

Built for the Qloo Agentic Hackathon 2026. Qloo's taste graph is the engine behind every design decision.

## What it does

- **Taste interview.** Arcon asks about the films, places, brands and things you love, and reads them through
  Qloo's taste graph into a style, a moodboard and the reasons behind each choice.
- **Plans and 3D.** Three floor plans for your site, each with its trade-offs, and a 3D walkthrough. You can also
  upload a plan you already have.
- **Budget and shopping.** A budget by room in your local currency, a timeline, a greenery score and a shopping
  list of taste-matched brands and local stores.
- **Make changes by chat.** Ask the designer agent for changes; the plan, 3D and budget update together.
- **Accounts and roles.** Homeowners, business owners, architects and builders each get their own home. Invite
  people by link or QR, or find a pro by taste match.
- **Project thread.** One chat per project with room tags, photos and files, review and approval.
- **Studio tools.** New clients in person or by link, fee milestones, studio branding on exports.
- **Building site.** Phases from the design's timeline, materials taken off the plan, crew and attendance,
  orders, photo updates and alerts, followed by everyone on the project. Run by the builder, or by an owner
  managing the build themselves.

## Repo layout

- `app/` holds the pages and API routes (Next.js App Router).
- `components/` holds the screens; `components/fx` the shared sounds and motion.
- `lib/` holds the logic, each part with its tests next to it (`*.test.ts`).
- `db/migrations/` holds the database tables, applied in order by `npm run migrate`.
- `scripts/` holds small tools for checking things against the real services.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and `.env.local` and fill in your keys. Never commit them.
3. `npm run migrate` creates the database tables in Supabase.
4. `npm run dev`, then open http://localhost:3000.
5. `npm test` runs the unit tests.
