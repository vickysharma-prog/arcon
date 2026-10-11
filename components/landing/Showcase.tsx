"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PlanSvg } from "@/components/plan/PlanSvg";
import { CountUp } from "@/components/fx/Motion";
import { tick } from "@/components/fx/sfx";
import { TEMPLATES, DEFAULT_SHELLS } from "@/lib/layout/templates";
import { place } from "@/lib/layout/place";
import { buildingShell } from "@/lib/layout/footprint";
import { INTRO_DONE } from "./Intro";

// three.js needs the browser, and it is the heaviest thing on the page, so it loads only once the intro has gone.
const HouseScene = dynamic(() => import("@/components/three/HouseScene"), {
  ssr: false,
  loading: () => <Loading />,
});

// A sample home built by the real layout engine, finished in an invented warm-modern brief.
const PROGRAM = TEMPLATES.house;
const BRIEF = {
  name: "Warm modern",
  summary: "Oak, linen and soft light, with plants by every window",
  palette: [
    { role: "base", hex: "#efe6da" },
    { role: "wood", hex: "#b48a5c" },
    { role: "accent", hex: "#2f5d45" },
    { role: "dark", hex: "#2c2a27" },
  ],
  materials: [
    { name: "Oak floors", where: "living and bedrooms" },
    { name: "Limewash plaster", where: "walls" },
  ],
};

// Invented examples of the taste behind each kind of room.
const NOTES: { room: string; note: string; from: string }[] = [
  { room: "Living room", note: "Warm oak, low lamps", from: "a slow film you rewatch" },
  { room: "Kitchen", note: "A long wooden bar", from: "the café you never leave" },
  { room: "Primary bedroom", note: "Linen and soft daylight", from: "linen sheets, always" },
  { room: "Study", note: "Deep green, a record shelf", from: "old jazz while you cook" },
  { room: "Family room", note: "Low seating, plants by the window", from: "a trip to the hills" },
];

export function Showcase() {
  const still = useReducedMotion();
  const layout = useMemo(() => place(PROGRAM, buildingShell(PROGRAM, DEFAULT_SHELLS.house)), []);
  const [level, setLevel] = useState(0);
  const [note, setNote] = useState(0);
  const [ready, setReady] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Start the 3D once the intro has gone and the card is on screen.
  useEffect(() => {
    let introGone = !document.querySelector(".intro") || getComputedStyle(document.querySelector(".intro")!).display === "none";
    let seen = false;
    const go = () => {
      if (introGone && seen) setReady(true);
    };
    const onIntro = () => {
      introGone = true;
      go();
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        seen = true;
        go();
      }
    });
    if (box.current) io.observe(box.current);
    window.addEventListener(INTRO_DONE, onIntro);
    return () => {
      io.disconnect();
      window.removeEventListener(INTRO_DONE, onIntro);
    };
  }, []);

  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setNote((i) => (i + 1) % NOTES.length), 3200);
    return () => clearInterval(t);
  }, [still]);

  const n = NOTES[note];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-paper-raised/90 p-3 shadow-[0_40px_100px_-50px_var(--accent)] backdrop-blur sm:p-4">
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent animate-[edge_2.4s_linear_infinite] motion-reduce:animate-none" />
      <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf" />
          Live 3D · sample home
        </span>
        <div className="flex rounded-full border border-line p-0.5" role="radiogroup" aria-label="Floor">
          {["Ground", "Upper"].map((f, i) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={level === i}
              onClick={() => {
                tick();
                setLevel(i);
              }}
              className={`rounded-full px-2.5 py-1 tracking-[0.15em] transition ${level === i ? "bg-btn text-btn-ink" : "hover:text-ink"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div ref={box} className="relative mt-3 h-[340px] overflow-hidden rounded-xl border border-line bg-[#dfe8f3] sm:h-[380px]">
        {ready ? (
          <HouseScene layout={layout} brief={BRIEF} mode="orbit" cutaway upTo={level} playing={false} autoRotate={!still} wheelZoom={false} />
        ) : (
          <Loading />
        )}
        {/* the same home as a plan, in the corner */}
        <div className="pointer-events-none absolute bottom-2 left-2 w-28 rounded-lg border border-line bg-paper/85 p-1.5 shadow-sm backdrop-blur sm:w-36">
          <PlanSvg layout={layout} level={level} units="metric" className="h-auto w-full" />
          <p className="mt-1 text-center font-mono text-[8px] uppercase tracking-[0.2em] text-ink-soft">{level ? "Upper" : "Ground"} floor plan</p>
        </div>
        <p className="pointer-events-none absolute right-2 top-2 rounded-full bg-paper/80 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft backdrop-blur">
          Drag to explore · tap a room
        </p>
      </div>

      <div className="mt-3 flex min-h-[44px] items-center gap-3 border-t border-line pt-3">
        <AnimatePresence mode="wait">
          <motion.div key={n.room} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="min-w-0 flex-1">
            <p className="truncate text-sm">
              <span className="text-ink-soft">{n.room} · </span>
              <span className="font-medium">{n.note}</span>
            </p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-accent">from “{n.from}”</p>
          </motion.div>
        </AnimatePresence>
        <Readout label="Green" tone="text-leaf">
          <CountUp value={96} duration={2.2} />
        </Readout>
        <Readout label="Match">
          <CountUp value={92} duration={2.2} />%
        </Readout>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="grid h-full place-items-center">
      <div className="text-center">
        <div className="mx-auto h-px w-40 overflow-hidden bg-line">
          <div className="h-px w-1/3 animate-[edge_1.2s_linear_infinite] bg-accent" />
        </div>
        <p className="mt-3 font-mono text-xs text-ink-soft">&gt; building the 3D model…</p>
      </div>
    </div>
  );
}

function Readout({ label, children, tone = "text-ink" }: { label: string; children: ReactNode; tone?: string }) {
  return (
    <div className="shrink-0 text-center">
      <p className={`font-serif text-2xl leading-none ${tone}`}>{children}</p>
      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft">{label}</p>
    </div>
  );
}
