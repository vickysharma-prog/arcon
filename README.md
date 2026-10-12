# Arcon

An AI architect agent that designs a space around who you are. One interview turns your taste, site and budget into a floor plan, a 3D walkthrough, a budget and a timeline you can share with the people who will build it.

Built for the Qloo Agentic Hackathon 2026. Qloo's taste graph is the engine behind every design decision.

## Repo layout

- `scripts/qloo_probe.py` is a small script for querying the Qloo API.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and `.env.local` and fill in your keys. Never commit them.
3. `npm run migrate` creates the database tables in Supabase.
4. `npm run dev`, then open http://localhost:3000.
5. `npm test` runs the unit tests.
