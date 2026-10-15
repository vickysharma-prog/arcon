"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TEMPLATES, DEFAULT_SHELLS } from "@/lib/layout/templates";
import { place } from "@/lib/layout/place";
import { buildingShell } from "@/lib/layout/footprint";
import { INTRO_DONE } from "./Intro";

// three.js needs the browser, and it is the heaviest thing on the page, so it loads only once the intro has gone.
const HouseScene = dynamic(() => import("@/components/three/HouseScene"), {
  ssr: false,
  loading: () => <Loading />,
});

// A sample home built by the real layout engine, seen from above with the roof off, in the site's own colours: pale
// walls, light oak floors, blue accents. An invented Scandinavian taste gives each room its mood and light.
const PROGRAM = TEMPLATES.house;
const TASTE = {
  tags: [
    { family: "decor", value: "scandinavian", weight: 3, sources: [{ name: "a trip to the hills", layer: 1 }] },
    { family: "ambience", value: "cozy", weight: 2, sources: [{ name: "a slow film you rewatch", layer: 1 }] },
    { family: "ambience", value: "bright", weight: 1.5, sources: [{ name: "the café you never leave", layer: 1 }] },
    { family: "ambience", value: "relaxing", weight: 1, sources: [{ name: "linen sheets, always", layer: 1 }] },
  ],
  brands: [],
};
const BRIEF = {
  name: "Pale Scandinavian",
  summary: "Pale timber, linen and soft light",
  palette: [
    { role: "base", hex: "#f4f7fb" },
    { role: "wood", hex: "#cdb497" },
    { role: "accent", hex: "#2f6fed" },
    { role: "dark", hex: "#55657d" },
  ],
  materials: [
    { name: "Pale timber floors", where: "living and bedrooms" },
    { name: "White paint", where: "walls" },
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

// The showcase plays like a film: the sketch of each floor, then the same house in full colour by day, then by night,
// and round again. No buttons and no frame: the page is the canvas and the house sits on it.
// Inside, floor by floor: each floor drawn as a sketch, then the same floor in colour, and upstairs at night with
// every room lit.
const PHASES = [
  { id: "ground-sketch", sketch: true, level: 0, night: false },
  { id: "ground", sketch: false, level: 0, night: false },
  { id: "upper-sketch", sketch: true, level: 1, night: false },
  { id: "upper", sketch: false, level: 1, night: false },
  { id: "night", sketch: false, level: 1, night: true },
] as const;

export function Showcase() {
  const still = useReducedMotion();
  const layout = useMemo(() => place(PROGRAM, buildingShell(PROGRAM, DEFAULT_SHELLS.house)), []);
  const [phase, setPhase] = useState(0);
  const p = PHASES[phase];
  const level = p.level;
  const [swap, setSwap] = useState(false);
  // A short fade whenever the drawing or the floor changes (day to night is lit, not faded).
  const view = `${p.sketch}-${level}`;
  const was = useRef(view);
  useEffect(() => {
    if (was.current === view || still) return;
    was.current = view;
    setSwap(true);
    const t = setTimeout(() => setSwap(false), 450);
    return () => clearTimeout(t);
  }, [view, still]);
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
    const f = setInterval(() => setPhase((i) => (i + 1) % PHASES.length), 6000);
    return () => {
      clearInterval(t);
      clearInterval(f);
    };
  }, [still]);

  const n = NOTES[note];
  // No frame: the house is drawn straight onto the page.
  return (
    <div className="relative">
      <div ref={box} className="relative h-[380px] sm:h-[500px] lg:-mr-16 lg:h-[600px]">
        {/* one 3D view for every phase (rebuilding it would stutter); a short fade covers the change from sketch to colour */}
        <motion.div className="absolute inset-0" animate={{ opacity: swap ? 0.15 : 1, filter: swap ? "blur(6px)" : "blur(0px)" }} transition={{ duration: 0.45 }}>
          {ready ? (
            <HouseScene layout={layout} brief={BRIEF} taste={TASTE} newBuild mode="showcase" sketch={p.sketch} night={p.night} cutaway upTo={level} playing={false} />
          ) : (
            <Loading />
          )}
        </motion.div>
      </div>

      <div className="relative -mt-4 flex items-end gap-5">
        <AnimatePresence mode="wait">
          <motion.div key={n.room} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="min-w-0 flex-1">
            <p className="truncate text-sm">
              <span className="text-ink-soft">{n.room} · </span>
              <span className="font-medium">{n.note}</span>
            </p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-accent">from “{n.from}”</p>
          </motion.div>
        </AnimatePresence>
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
