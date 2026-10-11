"use client";

import { useEffect, useState } from "react";
import { seeds, SIZE } from "@/lib/brand/seeds";
import { burst, chime, transition } from "@/components/fx/sfx";

const SEEDS = seeds();
const SEEN = "arcon-intro";

// Runs before the overlay is painted: a visitor who saw the intro this session, or asks for less motion, skips it.
const SKIP = `try{if(sessionStorage.getItem("${SEEN}")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("intro-seen")}catch(e){}`;

/** The boot sound: a data burst, a rising sweep, then a soft chord as the page opens. */
function boot() {
  burst();
  setTimeout(transition, 120);
  setTimeout(chime, 520);
}

// The opening: the seed mark grows from the centre out, the name resolves under it, and a scan line runs. Browsers
// only allow sound after a click, so a fresh visitor taps to enter and the tap plays the boot sound; someone who
// clicked their way here from inside the app hears it at once. It is plain CSS underneath, so it still fades out on
// its own if scripts are slow or nobody taps.
export function Intro() {
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gate, setGate] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains("intro-seen")) {
      setGone(true);
      return;
    }
    try {
      sessionStorage.setItem(SEEN, "1");
    } catch {}
    const timers: ReturnType<typeof setTimeout>[] = [];
    const leave = () => {
      setLeaving(true);
      timers.push(setTimeout(() => setGone(true), 600));
    };
    if ((navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) {
      timers.push(setTimeout(boot, 150), setTimeout(leave, 2300));
      return () => timers.forEach(clearTimeout);
    }
    setGate(true);
    const enter = () => {
      boot();
      leave();
    };
    // The CSS fades the intro out at 9 seconds; after that a click belongs to the page, not the intro.
    timers.push(setTimeout(() => setGone(true), 9600));
    window.addEventListener("pointerdown", enter, { once: true });
    window.addEventListener("keydown", enter, { once: true });
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("pointerdown", enter);
      window.removeEventListener("keydown", enter);
    };
  }, []);

  if (gone) return null;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SKIP }} />
      <div className={`intro fixed inset-0 z-50 grid cursor-pointer place-items-center bg-paper ${leaving ? "intro-leaving" : ""}`} aria-hidden>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)", backgroundSize: "36px 36px" }}
        />
        <div className="intro-scan pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-accent/15 to-transparent" />
        <div className="relative flex flex-col items-center">
          <svg width="132" height="132" viewBox={`0 0 ${SIZE} ${SIZE}`} className="intro-mark">
            {SEEDS.map((s, i) => (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={s.r}
                className={`intro-seed ${s.accent ? "fill-accent" : "fill-ink"}`}
                style={{ transformOrigin: `${s.x}px ${s.y}px`, animationDelay: `${i * 14}ms` }}
              />
            ))}
          </svg>
          <p className="mt-6 flex font-serif text-5xl leading-none">
            {"Arcon".split("").map((ch, i) => (
              <span key={i} className="intro-letter" style={{ animationDelay: `${900 + i * 70}ms` }}>
                {ch}
              </span>
            ))}
          </p>
          <p className="intro-letter mt-4 font-mono text-[11px] uppercase tracking-[0.4em] text-ink-soft" style={{ animationDelay: "1300ms" }}>
            AI architect · taste by Qloo
          </p>
          <div className="mt-6 h-px w-48 overflow-hidden bg-line">
            <div className="intro-bar h-px bg-gradient-to-r from-btn to-accent" />
          </div>
          {gate && (
            <p className="intro-letter mt-8 flex items-center gap-3 rounded-full border border-accent/50 px-5 py-2 font-mono text-xs uppercase tracking-[0.3em] text-accent" style={{ animationDelay: "1700ms" }}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Tap to enter
            </p>
          )}
        </div>
      </div>
    </>
  );
}
