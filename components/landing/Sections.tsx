"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatedMark } from "@/components/AnimatedMark";
import { Logo } from "@/components/Logo";
import { HomeLink } from "./Intro";
import { CountUp, HudCard, Reveal, Ring } from "@/components/fx/Motion";
import { tick, transition } from "@/components/fx/sfx";

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">{children}</p>;
}

function Heading({ eyebrow, title, sub }: { eyebrow: string; title: ReactNode; sub?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg text-ink-soft">{sub}</p>}
    </Reveal>
  );
}

// The numbers under the hero, running past slowly.
const FACTS = ["7 kinds of space", "3 plan options every time", "Budgets in 8 markets", "English, हिंदी, Hinglish", "About 8 minutes", "Plants in every room", "Walk through it in 3D"];

export function Facts() {
  return (
    <div className="relative overflow-hidden border-y border-line bg-paper-raised/60 py-4" aria-label={FACTS.join(", ")}>
      <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-10 motion-reduce:animate-none" aria-hidden>
        {[...FACTS, ...FACTS].map((f, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap font-mono text-xs uppercase tracking-[0.25em] text-ink-soft">
            {f}
            <span className="h-1 w-1 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { n: "01", title: "Talk", body: "One question at a time. Tap an answer, type, or just speak." },
  { n: "02", title: "Taste", body: "Qloo reads what you love and finds the words for your style." },
  { n: "03", title: "Plans", body: "Three floor plans, each clear about what it does best and what it gives up." },
  { n: "04", title: "Walk", body: "Step inside in 3D. Click any piece to see the brand behind it." },
  { n: "05", title: "Build", body: "A budget by room, a timeline, a green score and a shopping list near you." },
];

export function HowItWorks() {
  const still = useReducedMotion();
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-8">
      <Heading eyebrow="How it works" title="From a conversation to a space you can walk through." />
      <div className="relative mt-16">
        {/* the line the steps hang from, drawing across as it scrolls in */}
        <motion.div
          aria-hidden
          className="absolute left-0 right-0 top-6 hidden h-px origin-left bg-gradient-to-r from-btn via-accent to-leaf md:block"
          initial={still ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <ol className="grid gap-8 md:grid-cols-5">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={0.15 * i}>
              <li className="relative">
                <span className="relative grid h-12 w-12 place-items-center rounded-full border border-accent/50 bg-paper font-mono text-sm text-accent">{s.n}</span>
                <h3 className="mt-4 font-serif text-2xl">{s.title}</h3>
                <p className="mt-2 text-ink-soft">{s.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Invented examples of what someone loves, the taste words found in them, and what the design does with them.
const LOVES = ["A slow film you rewatch every winter", "The corner café with the long wooden bar", "Linen sheets, always", "Old jazz while you cook"];
const TAGS = ["Low light", "Vintage", "Warm", "Natural materials", "Understated", "Cosy", "Earthy", "Handmade"];
const MAKES = ["Warm lamps, no glare from above", "A wooden bar between kitchen and living", "Oak floors and linen curtains", "A record shelf in a deep green study"];
// Which taste words each love carries, and which design choices each love leads to.
const LINKS: { tags: number[]; makes: number[] }[] = [
  { tags: [0, 1, 5], makes: [0, 3] },
  { tags: [2, 3, 7], makes: [1, 2] },
  { tags: [3, 4, 6], makes: [2] },
  { tags: [1, 2, 5], makes: [3, 1] },
];

export function TasteFlow() {
  const still = useReducedMotion();
  const [on, setOn] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (still || held) return;
    const t = setInterval(() => setOn((i) => (i + 1) % LOVES.length), 2800);
    return () => clearInterval(t);
  }, [still, held]);
  const link = LINKS[on];

  return (
    <section id="taste" className="relative scroll-mt-24 overflow-hidden border-y border-line bg-paper-raised/50 py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
        <Heading
          eyebrow="Taste becomes space"
          title="Your films, cafés and brands, read by Qloo's taste AI."
          sub="Most design tools ask you to describe a style. Arcon finds it in the things you already love, then shows you why every choice was made."
        />
        <div className="mt-16 grid gap-8 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:gap-4" onMouseLeave={() => setHeld(false)}>
          <Column title="You say">
            {LOVES.map((l, i) => (
              <button
                key={l}
                type="button"
                onMouseEnter={() => {
                  setHeld(true);
                  setOn(i);
                }}
                onClick={() => {
                  tick();
                  setHeld(true);
                  setOn(i);
                }}
                className={`w-full rounded-2xl border px-5 py-4 text-left text-base transition-all duration-300 sm:text-lg ${i === on ? "translate-x-1 border-accent bg-paper shadow-[0_14px_40px_-16px_var(--accent)]" : "border-line bg-paper/60 text-ink-soft"}`}
              >
                “{l}”
              </button>
            ))}
          </Column>
          <Flow />
          <Column title="Qloo reads">
            <div className="relative flex flex-wrap justify-center gap-2.5 rounded-3xl border border-accent/30 bg-paper/70 px-5 py-8 shadow-[0_0_80px_-30px_var(--accent)]">
              {/* the taste engine at the centre, pulsing */}
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_70%)] animate-pulse motion-reduce:animate-none" />
              {TAGS.map((t, i) => (
                <motion.span
                  key={t}
                  animate={{ scale: link.tags.includes(i) ? 1.08 : 1, opacity: link.tags.includes(i) ? 1 : 0.45 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`relative rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-wider sm:text-sm ${link.tags.includes(i) ? "border-accent bg-accent/10 text-accent shadow-[0_0_24px_-6px_var(--accent)]" : "border-line"}`}
                >
                  {t}
                </motion.span>
              ))}
            </div>
          </Column>
          <Flow />
          <Column title="Arcon designs">
            {MAKES.map((m, i) => (
              <motion.p
                key={m}
                animate={{ opacity: link.makes.includes(i) ? 1 : 0.4, x: link.makes.includes(i) ? 0 : 6 }}
                className={`flex items-start gap-2 rounded-2xl border px-5 py-4 text-base transition-colors sm:text-lg ${link.makes.includes(i) ? "border-leaf/60 bg-paper shadow-[0_14px_40px_-20px_var(--leaf)]" : "border-line bg-paper/60"}`}
              >
                <span className="mt-0.5 text-leaf">✓</span>
                {m}
              </motion.p>
            ))}
          </Column>
        </div>
        <Reveal className="mt-10 text-center text-sm text-ink-soft">
          Every room, material and brand in your design carries a note on which of your loves it came from.
        </Reveal>
      </div>
    </section>
  );
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal>
      <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-ink-soft">{title}</p>
      <div className="space-y-2">{children}</div>
    </Reveal>
  );
}

// Dots running from one column to the next.
function Flow() {
  const still = useReducedMotion();
  return (
    <div aria-hidden className="relative mx-auto h-12 w-px overflow-hidden bg-line md:h-px md:w-20 lg:w-28">
      {!still &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute left-0 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent md:translate-x-0"
            animate={{ left: ["0%", "100%"], top: ["0%", "100%"] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.45, ease: "linear" }}
            style={{ boxShadow: "0 0 8px var(--accent)" }}
          />
        ))}
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-8">
      <Heading eyebrow="What you get" title="Everything a first meeting with an architect gives you, in minutes." />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Feature delay={0} title="Talk in your language" body="Speak or type in English, हिंदी or Hinglish. Tap answers when you'd rather not type.">
          <Bars />
        </Feature>
        <Feature delay={0.08} title="Bring your own plan" body="Upload a photo, scan or PDF. Arcon reads every room and builds from it.">
          <MiniPlan />
        </Feature>
        <Feature delay={0.16} title="Three plans, honest trade-offs" body="Each option says what it does best and what it gives up next to the other two.">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-12 flex-1 rounded-md border ${i === 1 ? "border-accent bg-accent/10" : "border-line"}`} />
            ))}
          </div>
        </Feature>
        <Feature delay={0.24} title="Walk through it in 3D" body="Step from room to room. Click a chair or a lamp to see its brand and price.">
          <Cube />
        </Feature>
        <Feature delay={0} title="A budget in your currency" body="Researched rates for 8 markets and four finish levels, room by room.">
          <p className="font-serif text-4xl text-ink">
            $<CountUp value={48200} format={(v) => Math.round(v).toLocaleString("en-US")} />
          </p>
        </Feature>
        <Feature delay={0.08} title="Green by default" body="Plants in every room and a score out of 100, with easy ways to raise it.">
          <Ring value={96} size={64} stroke={6} />
        </Feature>
        <Feature delay={0.16} title="A shopping list near you" body="Brands at your price level, a cheaper and a dearer pick, and stores close by.">
          <div className="space-y-1.5">
            {[80, 64, 72].map((w, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-leaf" />
                <span className="h-2 rounded-full bg-line" style={{ width: `${w}%` }} />
              </span>
            ))}
          </div>
        </Feature>
        <Feature delay={0.24} title="Every choice explained" body="A taste trail shows which of your loves led to each material, colour and piece.">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
            <span className="rounded border border-line px-1.5 py-0.5">film</span>→<span className="rounded border border-accent px-1.5 py-0.5 text-accent">low light</span>→
            <span className="rounded border border-leaf px-1.5 py-0.5 text-leaf">lamps</span>
          </div>
        </Feature>
      </div>
    </section>
  );
}

function Feature({ title, body, children, delay }: { title: string; body: string; children: ReactNode; delay: number }) {
  return (
    <HudCard delay={delay} className="flex flex-col p-5">
      <div className="flex h-16 items-center">{children}</div>
      <h3 className="mt-4 font-serif text-xl">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-soft">{body}</p>
    </HudCard>
  );
}

function Bars() {
  const still = useReducedMotion();
  return (
    <div className="flex h-10 items-center gap-1">
      {Array.from({ length: 14 }, (_, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full bg-accent"
          animate={still ? { height: 14 } : { height: [6, 10 + ((i * 7) % 26), 6] }}
          transition={{ duration: 0.9 + (i % 4) * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

function MiniPlan() {
  return (
    <svg width="84" height="56" viewBox="0 0 84 56" fill="none" stroke="var(--accent)" strokeWidth="1.6" aria-hidden>
      <motion.path d="M2 2h80v52H2zM40 2v26H2M40 28h42M58 28v26" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.8, ease: "easeInOut" }} />
    </svg>
  );
}

function Cube() {
  const still = useReducedMotion();
  return (
    <motion.svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="var(--ink)" strokeWidth="1.4" aria-hidden animate={still ? {} : { rotate: [0, 8, 0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
      <path d="M28 4 50 16v24L28 52 6 40V16z" />
      <path d="M6 16l22 12 22-12M28 28v24" stroke="var(--accent)" />
    </motion.svg>
  );
}

const AUDIENCE = [
  { title: "Homeowners", body: "Planning a new build or a big renovation, and want to see it before anyone builds it." },
  { title: "Cafés, hotels, shops and offices", body: "Arcon asks how you run the place and who your guests are, then plans for both." },
  { title: "Architects and designers", body: "Send clients the interview, start from their taste, and present three options on day one." },
  { title: "Builders", body: "A clear plan, budget and timeline to quote from, all in one shared project." },
];

export function Audience() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
      <Heading eyebrow="Who it's for" title="Any space, for the people who will use it." />
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {AUDIENCE.map((a, i) => (
          <HudCard key={a.title} delay={i * 0.08} className="p-6">
            <h3 className="font-serif text-2xl">{a.title}</h3>
            <p className="mt-2 text-ink-soft">{a.body}</p>
          </HudCard>
        ))}
      </div>
    </section>
  );
}

const PLANS = [
  { name: "Free", price: "$0", per: "", for: "Anyone", cta: "Start free", features: ["The interview and your taste profile", "Your design brief", "One 2D plan", "A 3D preview"] },
  { name: "Owner", price: "$29", per: "/month", alt: "or $149 per project", for: "Homeowners and small businesses", cta: "Start with Owner", featured: true, features: ["Unlimited edits", "Full 3D and walkthrough", "Budget and timeline", "Shopping list", "Share with your builder"] },
  { name: "Pro", price: "$99", per: "/month per seat", for: "Architects and interior designers", cta: "Start with Pro", features: ["Everything in Owner", "Interview links for clients", "Drawings pack", "Branded reviews", "10 active projects"] },
  { name: "Build", price: "$299", per: "/month per company", for: "Builders and contractors", cta: "Start with Build", features: ["Everything in Pro", "Site tracking", "Crews and materials", "Progress updates for clients"] },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-24 border-t border-line bg-paper-raised/50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <Heading eyebrow="Pricing" title="Start free. Pay when you're ready to build." sub="Every plan starts with a free design. No card needed." />
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className={`relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 ${p.featured ? "border-accent bg-paper shadow-[0_30px_80px_-40px_var(--accent)]" : "border-line bg-paper"}`}
              >
                {p.featured && <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent animate-[edge_2.4s_linear_infinite] motion-reduce:animate-none" />}
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-2xl">{p.name}</h3>
                  {p.featured && <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">Best for most homes</span>}
                </div>
                <p className="mt-1 text-sm text-ink-soft">{p.for}</p>
                <p className="mt-5 font-serif text-5xl leading-none">
                  {p.price}
                  <span className="ml-1 font-sans text-sm text-ink-soft">{p.per}</span>
                </p>
                {p.alt && <p className="mt-1 text-sm text-ink-soft">{p.alt}</p>}
                <ul className="mt-6 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-leaf">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/start"
                  onClick={() => transition()}
                  className={`mt-6 rounded-full px-5 py-2.5 text-center transition ${p.featured ? "glow-btn" : "border border-line hover:border-accent hover:text-accent hover:shadow-[0_10px_30px_-14px_var(--accent)]"}`}
                >
                  {p.cta}
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCall() {
  return (
    <section className="relative overflow-hidden py-28">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center sm:px-8">
        <Reveal>
          <div className="drop-shadow-[0_0_40px_var(--accent)]">
            <AnimatedMark size={96} />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-8 font-serif text-4xl leading-tight sm:text-6xl">Your next space starts with a conversation.</h2>
        </Reveal>
        <Reveal delay={0.2}>
          <Link
            href="/start"
            onClick={() => transition()}
            className="glow-btn group mt-10 px-8 py-4 text-lg"
          >
            Start designing free <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:px-8">
        <HomeLink>
          <Logo size={22} />
        </HomeLink>
        <p>Taste intelligence powered by Qloo · © 2026 Arcon</p>
        <Link href="/privacy" className="hover:text-ink">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
