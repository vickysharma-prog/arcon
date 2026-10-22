"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DEMO_COOKIE } from "@/lib/demo/ids";
import { DEMO_ROLES, PEOPLE, type DemoRole } from "@/lib/demo/story";
import { TOUR } from "@/lib/demo/tour";
import { AnimatedMark } from "@/components/AnimatedMark";

// The judges' tour, kept out of the way: a small glass pill at the bottom (which stop, back and next). Pointing at it
// (or a tap) opens
// what this stop shows, whose view it is (switch in one click) and the way out. Shown only in a demo session.
const GO = "arcon-tour-go";
const IN_APP = /^\/(project|home|start|pros|account)(\/|$)/;

/** Which stop of the tour this is, and whose view, from the /demo route's cookie; null outside the demo. */
function useStop() {
  const path = usePathname();
  const [at, setAt] = useState<{ step: number; who: DemoRole } | null>(null);
  useEffect(() => {
    const raw = document.cookie.split("; ").find((c) => c.startsWith(`${DEMO_COOKIE}=`))?.split("=")[1];
    const [s, who] = decodeURIComponent(raw ?? "").split(".");
    // only inside the app the tour is showing, never on the landing page or other public pages
    setAt(raw && IN_APP.test(path) && DEMO_ROLES.includes(who as DemoRole) ? { step: Number(s) || 1, who: who as DemoRole } : null);
  }, [path]);
  return at;
}
const step = (n: number) => `/demo?step=${n}`;

/** Back and next in the page's own title row, beside the title, where people look for the way on. */
export function JudgeNext() {
  const at = useStop();
  if (!at) return null;
  const last = at.step === TOUR.length;
  return (
    <nav aria-label="Judges' tour" className="flex items-center gap-1 rounded-full border border-accent/40 bg-paper-raised p-1 shadow-[0_10px_30px_-18px_var(--accent)]">
      {at.step > 1 && (
        <a href={step(at.step - 1)} aria-label="Back" className="grid h-8 w-8 place-items-center rounded-full text-ink-soft transition hover:bg-paper hover:text-ink">
          ‹
        </a>
      )}
      <span className="px-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-accent">
        Tour {at.step}/{TOUR.length}
      </span>
      <a href={last ? "/demo?exit=start" : step(at.step + 1)} className="whitespace-nowrap rounded-full bg-btn px-4 py-1.5 text-sm text-btn-ink transition hover:opacity-90">
        {last ? "Try it yourself" : `Next: ${TOUR[at.step].title.split(" ").slice(0, 4).join(" ")} ›`}
      </a>
    </nav>
  );
}

export function JudgeBar() {
  const path = usePathname();
  const still = useReducedMotion();
  const at = useStop();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const leave = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Between stops: Arcon's mark over the page while the next one loads, then a fade into it.
  const [veil, setVeil] = useState<"in" | "out" | null>(null);
  useEffect(() => {
    if (!at) return;
    let arrived = false;
    try {
      arrived = sessionStorage.getItem(GO) === "1";
      sessionStorage.removeItem(GO);
    } catch {}
    if (arrived) {
      setVeil("out");
      const t = setTimeout(() => setVeil(null), 900);
      return () => clearTimeout(t);
    }
  }, [at]);
  useEffect(() => {
    if (!at) return;
    // any tour link (next, back, a stop, another person's view) shows the veil as it leaves
    const go = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.("a[href^='/demo']");
      if (!a || e.metaKey || e.ctrlKey) return;
      try {
        sessionStorage.setItem(GO, "1");
      } catch {}
      setVeil("in");
    };
    document.addEventListener("click", go, true);
    return () => document.removeEventListener("click", go, true);
  }, [at]);
  // Room under the page for the pill, so nothing at the bottom hides behind it.
  useEffect(() => {
    if (!at) return;
    document.body.style.paddingBottom = "84px";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [at]);
  // On a long page, a soft hint to scroll, gone at the first scroll.
  const [hint, setHint] = useState(false);
  useEffect(() => {
    if (!at) return;
    setHint(false);
    const show = setTimeout(() => {
      if (window.scrollY < 40 && document.documentElement.scrollHeight > window.innerHeight * 1.35) setHint(true);
    }, 1800);
    const hide = () => setHint(false);
    window.addEventListener("scroll", hide, { once: true });
    const stop = setTimeout(hide, 9000);
    return () => {
      clearTimeout(show);
      clearTimeout(stop);
      window.removeEventListener("scroll", hide);
    };
  }, [at, path]);
  useEffect(() => setOpen(false), [path]);
  // A button a judge presses that would change the demo is refused by the server (proxy.ts); some screens keep quiet
  // about a failed request, so the bar says it once, for all of them.
  const [refused, setRefused] = useState(false);
  useEffect(() => {
    if (!at) return;
    const real = window.fetch;
    let hide: ReturnType<typeof setTimeout>;
    window.fetch = async (...args) => {
      const res = await real(...args);
      if (res.status === 403 && res.headers.get("x-arcon-demo") === "view-only") {
        setRefused(true);
        clearTimeout(hide);
        hide = setTimeout(() => setRefused(false), 4000);
      }
      return res;
    };
    return () => {
      window.fetch = real;
      clearTimeout(hide);
    };
  }, [at]);
  // a tap anywhere else, or Escape, closes it
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);
  if (!at) return null;

  const stop = TOUR[at.step - 1];
  const last = at.step === TOUR.length;
  const here = typeof location === "undefined" ? "/home" : location.pathname + location.search;

  return (
    <>
      <AnimatePresence>
        {veil && (
          <motion.div
            key="veil"
            aria-hidden
            initial={{ opacity: veil === "in" ? 0 : 1 }}
            animate={{ opacity: veil === "in" ? 1 : 0 }}
            transition={{ duration: veil === "in" ? 0.25 : 0.7, ease: "easeOut" }}
            className="pointer-events-none fixed inset-0 z-[70] grid place-items-center bg-paper"
          >
            <div className="flex flex-col items-center">
              <AnimatedMark size={64} />
              <p className="mt-4 font-serif text-2xl">Arcon</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Taste intelligence by Qloo</p>
            </div>
          </motion.div>
        )}
        {hint && !veil && (
          <motion.div
            key="hint"
            aria-hidden
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed bottom-20 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-1.5 rounded-2xl border border-line/70 bg-paper-raised/90 px-4 py-2.5 text-ink-soft shadow-lg backdrop-blur-md"
          >
            <span className="relative h-8 w-5 rounded-full border-2 border-current">
              <span className="absolute left-1/2 top-1.5 h-1.5 w-1 -translate-x-1/2 animate-bounce rounded-full bg-current motion-reduce:animate-none" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Scroll for more</span>
          </motion.div>
        )}
      </AnimatePresence>
    {/* the pill: opens as the pointer reaches it (a tap on a phone), closes a moment after it leaves */}
    <div
      ref={box}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        clearTimeout(leave.current);
        setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") leave.current = setTimeout(() => setOpen(false), 250);
      }}
      className="fixed bottom-3 left-1/2 z-[60] w-[min(36rem,calc(100vw-1rem))] -translate-x-1/2"
    >
      <AnimatePresence>
        {refused && !open && (
          <motion.p
            role="status"
            initial={still ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={still ? undefined : { opacity: 0, y: 6 }}
            className="mb-2 rounded-xl border border-accent/40 bg-paper-raised/95 px-4 py-2.5 text-center text-sm shadow-lg backdrop-blur-xl"
          >
            The judges&apos; demo is view only, so nothing changes.{" "}
            <a href="/demo?exit=start" className="text-accent underline-offset-2 hover:underline">
              Try it on your own project
            </a>
          </motion.p>
        )}
        {open && (
          <motion.div
            id="judge-more"
            initial={still ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={still ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="mb-2 rounded-2xl border border-line/70 bg-paper-raised/95 p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">{PEOPLE[at.who].label}&apos;s view</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{stop.what}</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">See it as</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {DEMO_ROLES.map((r) => (
                <a
                  key={r}
                  href={`/demo?as=${r}&from=${encodeURIComponent(here)}`}
                  aria-current={r === at.who ? "true" : undefined}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${r === at.who ? "border-accent bg-accent text-btn-ink" : "border-line hover:border-accent hover:text-accent"}`}
                >
                  {PEOPLE[r].label} <span className="opacity-70">· {PEOPLE[r].name.split(" ")[0]}</span>
                </a>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1 border-t border-line/70 pt-2.5">
              {/* jump to any stop */}
              {TOUR.map((t, i) => (
                <a key={i} href={step(i + 1)} title={t.title} aria-label={`Stop ${i + 1}: ${t.title}`} className={`h-1.5 rounded-full transition ${i + 1 === at.step ? "w-5 bg-accent" : i + 1 < at.step ? "w-2.5 bg-accent/50" : "w-2.5 bg-line hover:bg-accent/40"}`} />
              ))}
              <a href="/demo?exit" className="ml-auto text-xs text-ink-soft transition hover:text-ink">
                Exit the tour
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the pill */}
      <div className="flex items-center gap-1 rounded-full border border-line/70 bg-paper-raised/60 py-1 pl-1.5 pr-1 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <button
          type="button"
          // a mouse already opened it by pointing; a tap toggles it
          onClick={(e) => ((e.nativeEvent as PointerEvent).pointerType === "mouse" ? setOpen(true) : setOpen((o) => !o))}
          aria-expanded={open}
          aria-controls="judge-more"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full px-2 py-1 text-left transition hover:bg-paper/60"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-50 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-soft">
            {at.step}/{TOUR.length}
          </span>
          <span className="truncate text-sm">{stop.title}</span>
          <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" className={`shrink-0 text-ink-soft transition-transform ${open ? "" : "rotate-180"}`}>
            <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {at.step > 1 && (
          <a href={step(at.step - 1)} aria-label="Back" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-paper/60 hover:text-ink">
            ‹
          </a>
        )}
        <a href={last ? "/demo?exit=start" : step(at.step + 1)} className="shrink-0 rounded-full bg-btn px-3.5 py-1.5 text-sm text-btn-ink transition hover:opacity-90">
          {last ? "Try it yourself" : "Next ›"}
        </a>
      </div>
    </div>
    </>
  );
}
