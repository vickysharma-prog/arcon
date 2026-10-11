"use client";

import { useEffect, useState } from "react";
import { seeds, SIZE } from "@/lib/brand/seeds";
import { chime } from "@/components/fx/sfx";

const SEEDS = seeds();
const SEEN = "arcon-intro";

// Runs before the overlay is painted: a visitor who saw the intro this session, or asks for less motion, skips it.
const SKIP = `try{if(sessionStorage.getItem("${SEEN}")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("intro-seen")}catch(e){}`;

// The opening: the seed mark grows from the centre out, the name resolves under it, and a scan line runs before
// the page shows through. It is plain CSS, so it plays and leaves even if scripts are slow; a click or key skips it.
export function Intro() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains("intro-seen")) {
      setGone(true);
      return;
    }
    try {
      sessionStorage.setItem(SEEN, "1");
    } catch {}
    const skip = () => {
      chime();
      setGone(true);
    };
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    const done = setTimeout(() => setGone(true), 3200);
    return () => {
      clearTimeout(done);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  if (gone) return null;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SKIP }} />
      <div className="intro fixed inset-0 z-50 grid place-items-center bg-paper" aria-hidden>
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
        </div>
      </div>
    </>
  );
}
