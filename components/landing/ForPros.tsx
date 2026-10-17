"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Reveal } from "@/components/fx/Motion";
import { transition } from "@/components/fx/sfx";

// A sample studio day and a sample site, drawn as the app draws them, so a pro sees their own working week.
const CLIENTS = [
  { name: "The Park Slope brownstone", step: "Client is answering the interview", tone: "bg-accent" },
  { name: "Silver Lake bungalow", step: "Version 2 sent for review", tone: "bg-amber-500" },
  { name: "Café on Bedford Ave", step: "Approved · fees 2 of 3 received", tone: "bg-leaf" },
];
const PHASES = [
  { name: "Foundations and structure", pct: 100 },
  { name: "Electrical and plumbing", pct: 100 },
  { name: "Kitchen, bathrooms and joinery", pct: 60 },
  { name: "Floors, walls and ceilings", pct: 0 },
];

export function ForPros() {
  const still = useReducedMotion();
  return (
    <section id="pros" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">For architects and builders</p>
        <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Your studio and your sites, in the same place as your clients.</h2>
        <p className="mt-4 text-lg text-ink-soft">Start a client by link or in person, show three plans on day one, send for approval, then run the build and hand it over, with fees tracked at every stage.</p>
      </Reveal>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {/* Studio */}
        <Reveal>
          <div className="h-full rounded-2xl border border-line bg-paper-raised p-5">
            <p className="flex items-baseline justify-between">
              <span className="font-serif text-2xl">Studio</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">Sample week</span>
            </p>
            <ul className="mt-4 divide-y divide-line">
              {CLIENTS.map((c, i) => (
                <motion.li key={c.name} initial={still ? false : { opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.12 * i }} className="flex items-center gap-3 py-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.tone}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="block text-sm text-ink-soft">{c.step}</span>
                  </span>
                </motion.li>
              ))}
            </ul>
            <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
              <li>✓ New clients by link or QR, or met in person</li>
              <li>✓ Their taste read by Qloo before the first meeting</li>
              <li>✓ Approvals and change requests on record, with the cost of each change</li>
              <li>✓ Your logo on every drawing; clients find you by taste match</li>
            </ul>
            <p className="mt-5 text-sm">
              <span className="font-medium">$99 a month</span> <span className="text-ink-soft">· 14 days free</span>
            </p>
          </div>
        </Reveal>
        {/* Sites */}
        <Reveal delay={0.1}>
          <div className="h-full rounded-2xl border border-line bg-paper-raised p-5">
            <p className="flex items-baseline justify-between">
              <span className="font-serif text-2xl">Sites</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">Sample site</span>
            </p>
            <div className="mt-4 space-y-3">
              {PHASES.map((p, i) => (
                <div key={p.name}>
                  <p className="flex justify-between text-sm">
                    <span>{p.name}</span>
                    <span className="font-mono text-xs text-ink-soft">{p.pct}%</span>
                  </p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                    <motion.div className="h-full rounded-full bg-leaf" initial={{ width: still ? `${p.pct}%` : 0 }} whileInView={{ width: `${p.pct}%` }} viewport={{ once: true }} transition={{ delay: 0.15 * i, duration: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
            <ul className="mt-5 space-y-1.5 text-sm text-ink-soft">
              <li>✓ Crew and wages, materials and deliveries, site money</li>
              <li>✓ Photo updates the client follows from their phone</li>
              <li>✓ Paid by stage of the build; your own costs stay yours</li>
              <li>✓ Snags, the handover pack and the warranty when they move in</li>
            </ul>
            <p className="mt-5 text-sm">
              <span className="font-medium">$299 a month</span> <span className="text-ink-soft">· 14 days free</span>
            </p>
          </div>
        </Reveal>
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/login?mode=signup" onClick={() => transition()} className="glow-btn rounded-full px-7 py-3">
          Start my 14 days free
        </Link>
        <Link href="/resources" className="rounded-full border border-line px-7 py-3 transition hover:border-accent hover:text-accent">
          How it works for pros
        </Link>
      </div>
    </section>
  );
}

// What happens to what people tell Arcon, said plainly.
export function Trust() {
  const items = [
    { title: "No tracking, no ads", body: "One essential cookie keeps your project. Nothing follows you around the web." },
    { title: "Your project is yours", body: "Try it without an account; sign in to keep it, and delete it or your account any time." },
    { title: "Every choice explained", body: "Each material, colour and brand says which of your loves it came from." },
    { title: "Costs you can check", body: "Researched rates for eight markets, room by room and trade by trade, in your currency." },
  ];
  return (
    <section className="border-y border-line bg-paper-raised/60">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {items.map((t, i) => (
          <Reveal key={t.title} delay={0.06 * i}>
            <p className="font-serif text-xl">{t.title}</p>
            <p className="mt-1.5 text-sm text-ink-soft">{t.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
