"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Decode } from "@/components/fx/Decode";
import { tick } from "@/components/fx/sfx";
import { FAQ } from "@/lib/content/faq";

// Resources: everything to understand Arcon, in one page with a contents list that follows the reading. Guides for
// each kind of person, how Arcon works inside, questions people ask, and a guide for developers.

type Section = { id: string; group: string; title: string; body: ReactNode };

const Steps = ({ items }: { items: string[] }) => (
  <ol className="mt-4 space-y-2">
    {items.map((s, i) => (
      <li key={i} className="flex gap-3">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-accent/40 font-mono text-[11px] text-accent">{i + 1}</span>
        <span>{s}</span>
      </li>
    ))}
  </ol>
);

const Code = ({ children }: { children: string }) => (
  <pre className="mt-4 overflow-x-auto rounded-2xl border border-line bg-paper p-4 font-mono text-[13px] leading-relaxed">
    <code>{children}</code>
  </pre>
);

const SECTIONS: Section[] = [
  {
    id: "start",
    group: "Get started",
    title: "Arcon in two minutes",
    body: (
      <>
        <p>
          Arcon is an AI architect. You talk to it about who you are and what you love; it reads your taste through Qloo&apos;s taste graph and designs your space from it: a floor plan, a 3D walkthrough by day and night, a budget in your currency, a shopping list and a timeline. Then it stays with the project through review, approval and building.
        </p>
        <Steps
          items={[
            "Tell Arcon about the space: what it is, where, how big, who uses it, your budget.",
            "Find your style: pick a few places, brands, films or music you love. Qloo reads what they have in common.",
            "Choose one of three plans, each with what it does best and what it gives up, or upload your own.",
            "Walk through it in 3D, change anything by chat, and see the budget follow.",
            "Share it with your architect, client or builder, approve it, and follow the build.",
          ]}
        />
        <p className="mt-4">
          <Link href="/start" className="text-accent hover:underline">Start a design</Link> · <Link href="/quiz" className="text-accent hover:underline">Find your style in three taps</Link>
        </p>
      </>
    ),
  },
  {
    id: "home",
    group: "Get started",
    title: "Your home page",
    body: (
      <>
        <p>Once you sign in, Arcon opens on your own home page, laid out for how you use it. Every version starts with two things:</p>
        <Steps
          items={[
            "A status line: how many projects are at each stage, and how many things are waiting on you.",
            "Waiting on you: a design to review, changes asked, a fee to pay or confirm, work running late on site, a plan to choose, new messages. The most urgent comes first; tap one to go straight there.",
          ]}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ["My spaces", "Owners, of a home or a business. Your newest project in focus: its plan drawing itself, View in 3D, where it stands, what's next and an estimate; for a café, office, shop or hotel, a countdown to opening day too."],
            ["Studio", "Architects and designers. Fees billed and received, and every client in columns by stage."],
            ["Sites", "Builders. Today on every site: how far along, the phase, who's on site, what's behind."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-line bg-paper p-4">
              <p className="font-medium">{t}</p>
              <p className="mt-1 text-sm text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "shortcuts",
    group: "Get started",
    title: "Search, shortcuts and the app",
    body: (
      <>
        <Steps
          items={[
            "Press Ctrl+K (⌘K on a Mac), or the search button at the top, to jump anywhere: a project, or one part of it such as its budget, thread, site or 3D. Type any words in any order, like \"austin budget\".",
            "Get the app, at the top of every page: on a phone it installs Arcon to your home screen; on a computer it shows a code to scan for your phone, and in Chrome or Edge installs Arcon in its own window.",
            "Arcon plays its opening each time you open it, and remembers your theme and sound settings (in the profile menu).",
          ]}
        />
      </>
    ),
  },
  {
    id: "account",
    group: "Get started",
    title: "Deleting a project or your account",
    body: (
      <>
        <p>Everything you make in Arcon is yours to remove, at any time.</p>
        <Steps
          items={[
            "A project: the bin on its card in your home page, or Delete this project at the bottom of its overview. Only its owner can, and it goes for everyone on it, with its thread, files and site.",
            "Your account: Delete my account at the bottom of your account page, after typing DELETE. Every project you own goes with it; projects others shared with you stay with them.",
          ]}
        />
      </>
    ),
  },
  {
    id: "homeowners",
    group: "Guides",
    title: "For homeowners",
    body: (
      <>
        <p>My spaces puts your newest project in focus, with where it stands and what happens next.</p>
        <Steps
          items={[
            "Design as a guest for free; sign up to keep the project on every device.",
            "Unlock the project once to open the walkthrough, budget, shopping list, changes by chat and the drawings pack.",
            "Invite your architect or builder from Team, by link or QR code. Everyone talks in the project's thread.",
            "When your architect sends the design for review, approve it or ask for changes in the thread.",
            "Once building starts, follow progress, photos and spending in the Site tab, or run the build yourself.",
          ]}
        />
      </>
    ),
  },
  {
    id: "business",
    group: "Guides",
    title: "For business owners",
    body: (
      <>
        <p>Cafés, offices, shops and hotels get everything a home does, plus two things a business needs.</p>
        <Steps
          items={[
            "How you run it: tell Arcon how the place works (takeaway or table service, the kitchen, how many seats and people) or name a place you love, and the plans are ranked for it.",
            "The neighbourhood read: the local favourites around your site, the crowd they draw and their decor, so your space fits the street and stands out on it.",
          ]}
        />
      </>
    ),
  },
  {
    id: "architects",
    group: "Guides",
    title: "For architects and designers",
    body: (
      <>
        <p>Studio is your home page: fees billed and received, and every client in columns by stage, each with its plan and new messages.</p>
        <Steps
          items={[
            "New client: answer Let's get to know you together in a meeting, or send the client a link to answer at home.",
            "Design in pro mode: you make the changes; the client asks for them in the thread.",
            "Send for review. The client approves a version, which locks it; any later change needs approval again.",
            "Set fee milestones (design, approval, handover) and mark them billed and paid.",
            "Your studio name and logo go on client links, the thread and the drawings pack.",
          ]}
        />
      </>
    ),
  },
  {
    id: "builders",
    group: "Guides",
    title: "For builders",
    body: (
      <>
        <p>Sites is your home page: every active site with how far along it is, the phase, who&apos;s on site today and what&apos;s behind.</p>
        <Steps
          items={[
            "The phases come from the design's timeline, and the materials are taken off the approved plan.",
            "Add your crew once and mark attendance on each site, each day.",
            "Order materials, track deliveries and see stock running low.",
            "Post photo updates; the client sees progress and the budget, never your costs.",
            "Alerts tell you and the client when a phase runs late.",
          ]}
        />
      </>
    ),
  },
  {
    id: "how",
    group: "How it works",
    title: "From taste to a design",
    body: (
      <>
        <p>
          Every design decision in Arcon can be traced back to something you said you love. The strip under the top of the{" "}
          <Link href="/?site" className="text-accent hover:underline">home page</Link> shows it live: two loves, and what Qloo reads from them right now.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ["The interview", "An agent asks about the space and about you, in English, Hindi or Hinglish, typed or spoken."],
            ["Qloo's taste graph", "The things you name become Qloo entities. Qloo returns what they share: decor, ambience, price level, and brands and places that match."],
            ["The brief", "A style name and its words, a palette, materials and a moodboard, each linked to the taste behind it."],
            ["The plans", "A layout engine fits your rooms to the site three ways and checks each one against building rules."],
            ["3D and moods", "Each room gets a mood and light from the ambience of the places you love, by day and by night."],
            ["Budget and shopping", "Real cost tables for your market, in your currency, and brands at your price level, a tier up and a tier down."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-line bg-paper p-4">
              <p className="font-medium">{t}</p>
              <p className="mt-1 text-sm text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "faq",
    group: "How it works",
    title: "Questions",
    body: (
      <dl className="divide-y divide-line">
        {FAQ.map((f) => (
          <div key={f.q} className="py-4 first:pt-0">
            <dt className="font-medium">{f.q}</dt>
            <dd className="mt-1 text-ink-soft">{f.a}</dd>
          </div>
        ))}
      </dl>
    ),
  },
  {
    id: "developers",
    group: "Developers",
    title: "Developer guide",
    body: (
      <>
        <p>
          Arcon is a Next.js app (App Router, React, Tailwind) with three.js for the 3D, Supabase for accounts, data and files, Qloo&apos;s Insights API for taste, and an AI model for the interview and the brief. The interviewer is an agent with its own tools, instructions and evals.
        </p>
        <Code>{`app/          pages and API routes
components/   screens; components/fx holds the shared sounds and motion
lib/          the logic, each part with its tests beside it (*.test.ts)
agents/       the interviewer agent: instructions, tools, evals
db/migrations the database tables, applied in order
scripts/      tools for checking against the real services`}</Code>
        <p className="mt-6 font-medium">Run it</p>
        <Code>{`npm install
cp .env.example .env.local   # Supabase, Qloo and model keys
npm run migrate               # creates the tables
npm run dev                   # http://localhost:3000
npm test                      # unit tests`}</Code>
        <p className="mt-6 font-medium">The API</p>
        <p className="mt-1 text-sm text-ink-soft">Every route checks who is asking and their role on the project before it answers.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-line">
              {[
                ["POST /api/interview", "the interview agent, one turn at a time"],
                ["POST /api/taste", "names you love → Qloo entities and taste tags"],
                ["GET /api/projects/:id", "a project and your role on it"],
                ["POST /api/projects/:id/design", "brief, three plans and their trade-offs"],
                ["POST /api/projects/:id/choose", "pick a plan"],
                ["POST /api/projects/:id/edit", "a change by chat; saves a new version"],
                ["GET /api/projects/:id/budget", "the budget by room, in local currency"],
                ["GET /api/projects/:id/shopping", "taste-matched brands and local stores"],
                ["GET /api/projects/:id/neighbourhood", "the business neighbourhood read"],
                ["GET|POST /api/projects/:id/thread", "the project thread"],
                ["GET|POST /api/projects/:id/site", "phases, crew, materials, updates"],
                ["POST /api/projects/:id/opening", "set a business's opening day (owner only)"],
                ["DELETE /api/projects/:id", "delete a project (owner only)"],
                ["DELETE /api/account", "delete your account"],
                ["GET /api/palette", "your projects, for Ctrl+K"],
                ["GET /api/strip", "the landing page's live Qloo reads"],
                ["GET /api/quiz", "the style quiz: three picks → your style"],
                ["POST /api/email-check", "can this address receive mail?"],
              ].map(([r, d]) => (
                <tr key={r}>
                  <td className="whitespace-nowrap py-2 pr-4 font-mono text-[13px] text-accent">{r}</td>
                  <td className="py-2 text-ink-soft">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "privacy",
    group: "Developers",
    title: "Data and privacy",
    body: (
      <p>
        What Arcon stores, why, and how to delete it is in the <Link href="/privacy" className="text-accent hover:underline">privacy page</Link>. Taste data from Qloo is used to design your project and cached only to keep it fast.
      </p>
    ),
  },
];

export function Docs() {
  const [active, setActive] = useState(SECTIONS[0].id);

  // the contents list follows the section being read
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (seen) setActive(seen.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const groups = [...new Set(SECTIONS.map((s) => s.group))];
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">&gt; resources</p>
      <h1 className="mt-3 font-serif text-5xl sm:text-6xl">
        <Decode text="Understand Arcon" />
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">Guides for each way of using Arcon, how it turns taste into a design, answers to common questions, and a guide for developers.</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
          {/* on a phone the contents scroll sideways above the text */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:block lg:space-y-6 lg:overflow-visible lg:px-0">
            {groups.map((g) => (
              <div key={g} className="contents lg:block">
                <p className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft lg:block">{g}</p>
                <ul className="contents lg:mt-2 lg:block lg:space-y-0.5 lg:border-l lg:border-line">
                  {SECTIONS.filter((s) => s.group === g).map((s) => (
                    <li key={s.id} className="relative shrink-0">
                      <a
                        href={`#${s.id}`}
                        onClick={() => tick()}
                        className={`block whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition lg:rounded-none lg:border-0 lg:py-1 lg:pl-4 ${active === s.id ? "border-accent text-accent" : "border-line text-ink-soft hover:text-ink"}`}
                      >
                        {active === s.id && <motion.span layoutId="docs-mark" className="absolute -left-px top-0 hidden h-full w-0.5 bg-accent lg:block" />}
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0 space-y-16">
          {SECTIONS.map((s) => (
            <motion.section
              key={s.id}
              id={s.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">{s.group}</p>
              <h2 className="mt-1 font-serif text-3xl sm:text-4xl">{s.title}</h2>
              <div className="mt-4 leading-relaxed">{s.body}</div>
            </motion.section>
          ))}
        </div>
      </div>
    </main>
  );
}
