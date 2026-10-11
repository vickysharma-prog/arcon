"use client";

import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Small motion pieces shared by the design screens: sections that rise into view, numbers that count up, a score
// ring that fills, bars that grow, cards with blueprint corner marks, and a scanning loader. Every piece shows its
// final state at once for people who ask for reduced motion.

/** A section that rises and sharpens into view the first time it scrolls in. */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const still = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={still ? false : { opacity: 0, y: 24, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** A number that counts up to `value` when it comes into view, and glides to a new value when it changes. */
export function CountUp({ value, format = (v) => String(Math.round(v)), duration = 1.1 }: { value: number; format?: (v: number) => string; duration?: number }) {
  const still = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const from = useRef(0);
  const [shown, setShown] = useState(still ? value : 0);
  useEffect(() => {
    if (still) return setShown(value);
    if (!seen) return;
    const c = animate(from.current, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setShown(v) });
    from.current = value;
    return () => c.stop();
  }, [value, seen, still, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {format(shown)}
    </span>
  );
}

/** A ring that fills to `value` out of 100, with the number counting up in the middle. */
export function Ring({ value, size = 88, stroke = 7 }: { value: number; size?: number; stroke?: number }) {
  const still = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${Math.round(value)} out of 100`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--leaf)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={still ? false : { strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - Math.min(100, value) / 100) }}
          animate={{ strokeDashoffset: c * (1 - Math.min(100, value) / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute font-serif text-3xl text-leaf" aria-hidden>
        <CountUp value={value} />
      </span>
    </div>
  );
}

/** A bar that grows from the left to `pct` (0 to 100) when it comes into view. */
export function Bar({ pct, delay = 0, className = "h-1.5 bg-btn" }: { pct: number; delay?: number; className?: string }) {
  const still = useReducedMotion();
  return (
    <motion.div
      className={`rounded-full ${className}`}
      initial={still ? false : { width: 0 }}
      whileInView={{ width: `${pct}%` }}
      animate={{ width: `${pct}%` }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}

/** A card with blueprint corner marks that close in on hover, and a light scan line across it when it first shows. */
export function HudCard({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const still = useReducedMotion();
  const corner = "pointer-events-none absolute h-3 w-3 border-accent/70 transition-all duration-300 group-hover:h-5 group-hover:w-5";
  return (
    <Reveal delay={delay} className={`group relative overflow-hidden rounded-2xl border border-line bg-paper-raised transition-shadow duration-300 hover:shadow-[0_0_0_1px_var(--accent),0_12px_40px_-18px_var(--accent)] ${className}`}>
      <span aria-hidden className={`${corner} left-2 top-2 border-l border-t`} />
      <span aria-hidden className={`${corner} right-2 top-2 border-r border-t`} />
      <span aria-hidden className={`${corner} bottom-2 left-2 border-b border-l`} />
      <span aria-hidden className={`${corner} bottom-2 right-2 border-b border-r`} />
      {!still && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-accent/10 to-transparent"
          initial={{ y: "-100%" }}
          whileInView={{ y: "900%" }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, delay: delay + 0.2, ease: "easeInOut" }}
        />
      )}
      {children}
    </Reveal>
  );
}

/** A loading line: a beam sweeping across, with what is being worked on in monospace. */
export function Scanning({ label }: { label: string }) {
  const still = useReducedMotion();
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-paper px-3 py-2" role="status">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">{label}</p>
      {!still && (
        <motion.span
          aria-hidden
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-accent/25 to-transparent"
          animate={{ x: ["-120%", "320%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
