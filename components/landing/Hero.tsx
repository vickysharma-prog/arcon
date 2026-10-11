"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useState, type PointerEvent } from "react";
import { Logo } from "@/components/Logo";
import { ProfileMenu } from "@/components/ProfileMenu";
import { CountUp } from "@/components/fx/Motion";
import { tick, transition } from "@/components/fx/sfx";
import { HomeLink, INTRO_DONE } from "./Intro";

// The header for the landing page: the logo on its own at the left, the sections in a floating glass bar in the
// middle, and the way in at the right. A highlight slides under whichever link the pointer is on.
const LINKS = [
  ["How it works", "#how"],
  ["Taste", "#taste"],
  ["Features", "#features"],
  ["Pricing", "#pricing"],
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 py-4 sm:px-8">
        <HomeLink className="justify-self-start">
          <Logo size={28} />
        </HomeLink>
        <nav
          onMouseLeave={() => setHover(null)}
          className={`hidden items-center gap-1 rounded-full border p-1 text-sm backdrop-blur-md transition-all duration-300 md:flex ${scrolled ? "border-line bg-paper-raised/80 shadow-[0_10px_40px_-20px_var(--accent)]" : "border-line/70 bg-paper-raised/50"}`}
        >
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} onMouseEnter={() => setHover(href)} onClick={() => tick()} className="relative rounded-full px-4 py-1.5 text-ink-soft transition-colors hover:text-ink">
              {hover === href && <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-full bg-accent/10 ring-1 ring-accent/30" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative">{label}</span>
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 justify-self-end">
          <Link href="/start" onClick={() => transition()} className="glow-btn rounded-full px-5 py-2 text-sm">
            Sign up free
          </Link>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

const WORDS = ["who you are", "what you love", "how you live", "how you work"];

// The first screen: what Arcon does in one line, the way in, and a plan that designs itself from taste.
export function Hero() {
  const still = useReducedMotion();
  const [word, setWord] = useState(0);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotY = useSpring(useTransform(px, [0, 1], [-7, 7]), { stiffness: 120, damping: 18 });
  const rotX = useSpring(useTransform(py, [0, 1], [6, -6]), { stiffness: 120, damping: 18 });

  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
  }, [still]);

  const follow = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    e.currentTarget.style.setProperty("--mx", `${x * 100}%`);
    e.currentTarget.style.setProperty("--my", `${y * 100}%`);
    px.set(x);
    py.set(y);
  };

  return (
    <section
      onPointerMove={follow}
      className="relative overflow-hidden"
      style={{ background: "radial-gradient(600px circle at var(--mx, 70%) var(--my, 40%), color-mix(in srgb, var(--accent) 12%, transparent), transparent 60%)" }}
    >
      {/* blueprint grid, fading out toward the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
        <div>
          <motion.p
            initial={still ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-raised/70 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft backdrop-blur"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            AI architect · Powered by Qloo
          </motion.p>
          <h1 className="mt-6 font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            Spaces designed around
            <span className="relative block h-[1.15em] overflow-hidden text-accent">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={WORDS[word]}
                  className="absolute left-0 top-0 whitespace-nowrap"
                  initial={{ y: "100%", opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: "-100%", opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  {WORDS[word]}.
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Talk to Arcon about the films, places and things you love. It turns your taste into a floor plan, a 3D walkthrough, a budget in your currency and a shopping list, for a home, café, office, hotel, shop or studio.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/start"
              onClick={() => transition()}
              className="glow-btn group px-7 py-3.5 text-lg"
            >
              Start designing free <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link href="/start/plan" onClick={() => tick()} className="rounded-full border border-line bg-paper-raised/70 px-6 py-3.5 text-lg backdrop-blur transition hover:-translate-y-0.5 hover:border-accent hover:text-accent hover:shadow-[0_12px_36px_-14px_var(--accent)]">
              I have a floor plan
            </Link>
          </div>
          <p className="mt-5 text-sm text-ink-soft">English, हिंदी or Hinglish · type or talk · no account needed</p>
        </div>

        <motion.div style={still ? undefined : { rotateX: rotX, rotateY: rotY, transformPerspective: 1200 }} initial={still ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <PlanDemo />
        </motion.div>
      </div>
    </section>
  );
}

type Room = { x: number; y: number; w: number; h: number; name: string; note: string; from: string };

// Invented examples: what someone might say, and the room it shapes.
const ROOMS: Room[] = [
  { x: 10, y: 10, w: 220, h: 160, name: "Living", note: "Warm oak, low lamps", from: "a slow film you rewatch" },
  { x: 230, y: 10, w: 180, h: 110, name: "Kitchen", note: "A long wooden bar", from: "the café you never leave" },
  { x: 230, y: 120, w: 180, h: 170, name: "Bedroom", note: "Linen and soft daylight", from: "linen sheets, always" },
  { x: 10, y: 170, w: 110, h: 120, name: "Study", note: "Deep green, a record shelf", from: "jazz while you cook" },
  { x: 120, y: 170, w: 110, h: 120, name: "Bath", note: "Stone and ferns", from: "a trip to the hills" },
];
const PLANTS = [
  [30, 30],
  [205, 150],
  [390, 30],
  [390, 270],
  [30, 270],
  [210, 270],
  [250, 140],
];

// A floor plan drawing itself, then each room lighting up with the taste behind it.
function PlanDemo() {
  const still = useReducedMotion();
  const [on, setOn] = useState(0);
  // Wait for the intro to leave, so the plan draws itself where the visitor can see it.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!document.querySelector(".intro") || getComputedStyle(document.querySelector(".intro")!).display === "none") {
      setReady(true);
      return;
    }
    const go = () => setReady(true);
    window.addEventListener(INTRO_DONE, go);
    return () => window.removeEventListener(INTRO_DONE, go);
  }, []);
  useEffect(() => {
    if (still || !ready) return;
    const t = setInterval(() => setOn((i) => (i + 1) % ROOMS.length), 2400);
    return () => clearInterval(t);
  }, [still, ready]);
  const draw = (delay: number, duration = 1.4) =>
    still ? {} : { initial: { pathLength: 0, opacity: 0 }, animate: ready ? { pathLength: 1, opacity: 1 } : {}, transition: { pathLength: { delay, duration, ease: "easeInOut" as const }, opacity: { delay, duration: 0.01 } } };
  const room = ROOMS[on];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-paper-raised/90 p-4 shadow-[0_40px_100px_-50px_var(--accent)] backdrop-blur">
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent animate-[edge_2.4s_linear_infinite] motion-reduce:animate-none" />
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf" />
          Live · plan 2 of 3
        </span>
        <span>12.4 × 8.6 m</span>
      </div>

      <div className="relative mt-3">
        <svg viewBox="0 0 420 300" className="w-full" role="img" aria-label="A sample floor plan, each room shaped by a taste">
          {ROOMS.map((r, i) => (
            <motion.rect
              key={r.name}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              className="fill-accent"
              initial={false}
              animate={{ opacity: i === on ? 0.13 : 0 }}
              transition={{ duration: 0.5 }}
            />
          ))}
          <g fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="square">
            <motion.path d="M10 10H410V290H10Z" {...draw(0.6)} />
            <motion.path d="M230 10V90M230 130V290M230 120H300M340 120H410M10 170H60M100 170H230M120 170V210M120 250V290" strokeWidth="2" {...draw(1.4)} />
          </g>
          {/* furniture */}
          <g fill="none" stroke="var(--ink-soft)" strokeWidth="1.2">
            <motion.path d="M40 110h110v34H40z M60 60h70v30H60z" {...draw(2.2, 1)} />
            <motion.path d="M250 24h140v16H250z M300 60h60v34h-60z" {...draw(2.4, 1)} />
            <motion.path d="M290 200h90v70h-90z M290 200h90v16h-90z" {...draw(2.6, 1)} />
            <motion.path d="M22 190h60v24H22z M140 250h40v30h-40z" {...draw(2.8, 1)} />
          </g>
          {/* windows */}
          <g stroke="var(--accent)" strokeWidth="4">
            <motion.path d="M80 10h70 M300 10h60 M410 180v60 M10 60v60" {...draw(2, 0.8)} />
          </g>
          {PLANTS.map(([x, y], i) => (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="6"
              className="fill-leaf"
              initial={still ? false : { scale: 0, opacity: 0 }}
              animate={ready || still ? { scale: 1, opacity: 0.85 } : {}}
              transition={{ delay: 2.4 + i * 0.12, type: "spring", stiffness: 400, damping: 14 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
          ))}
          {ROOMS.map((r) => (
            <text key={r.name} x={r.x + 10} y={r.y + 20} className="fill-ink-soft font-mono text-[9px] uppercase tracking-widest">
              {r.name}
            </text>
          ))}
        </svg>

        {/* the taste behind the lit room */}
        <AnimatePresence mode="wait">
          <motion.div
            key={room.name}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="absolute max-w-[60%] rounded-xl border border-accent/40 bg-paper/95 px-3 py-2 shadow-lg backdrop-blur"
            style={{ left: `${((room.x + room.w / 2) / 420) * 100}%`, top: `${((room.y + room.h / 2) / 300) * 100}%`, translate: "-50% -50%" }}
          >
            <p className="text-sm font-medium leading-tight">{room.note}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">from “{room.from}”</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
        <Readout label="Green score" tone="text-leaf">
          <CountUp value={96} duration={2.2} />
        </Readout>
        <Readout label="Budget">
          $<CountUp value={48200} duration={2.2} format={(v) => Math.round(v).toLocaleString("en-US")} />
        </Readout>
        <Readout label="Taste match">
          <CountUp value={92} duration={2.2} />%
        </Readout>
      </div>
    </div>
  );
}

function Readout({ label, children, tone = "text-ink" }: { label: string; children: React.ReactNode; tone?: string }) {
  return (
    <div>
      <p className={`font-serif text-2xl leading-none ${tone}`}>{children}</p>
      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft">{label}</p>
    </div>
  );
}

// A soft blue light that follows the pointer across the whole page, on devices with a mouse.
export function CursorGlow() {
  const still = useReducedMotion();
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 220, damping: 28 });
  const sy = useSpring(y, { stiffness: 220, damping: 28 });
  const [mouse, setMouse] = useState(false);
  useEffect(() => {
    if (still || !matchMedia("(pointer: fine)").matches) return;
    setMouse(true);
    const move = (e: globalThis.PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [still, x, y]);
  if (!mouse) return null;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-30 h-[420px] w-[420px] rounded-full"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%", background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 16%, transparent), transparent 65%)" }}
    />
  );
}
