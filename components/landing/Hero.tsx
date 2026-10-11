"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useState, type PointerEvent } from "react";
import { Logo } from "@/components/Logo";
import { ProfileMenu } from "@/components/ProfileMenu";
import { tick, transition } from "@/components/fx/sfx";
import { HomeLink } from "./Intro";
import { Showcase } from "./Showcase";

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
          <Showcase />
        </motion.div>
      </div>
    </section>
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
      className="pointer-events-none fixed left-0 top-0 z-30 h-[180px] w-[180px] rounded-full"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%", background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 20%, transparent), transparent 70%)" }}
    />
  );
}
