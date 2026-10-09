"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Decode } from "@/components/fx/Decode";
import type { Layout } from "@/lib/layout/schema";
import type { Mode } from "@/components/three/HouseScene";

// three.js needs the browser, so the scene loads on the client only.
const HouseScene = dynamic(() => import("@/components/three/HouseScene"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center font-mono text-sm text-ink-soft">&gt; building your 3D model…</div>,
});

export function WalkthroughStep({ layout, palette, title }: { layout: Layout; palette?: { hex: string; role: string }[]; title?: string | null }) {
  const [mode, setMode] = useState<Mode>("walk");
  const [playing, setPlaying] = useState(true);
  const [room, setRoom] = useState("Outside");
  const [progress, setProgress] = useState(0);
  const [restart, setRestart] = useState(0);
  const [cutaway, setCutaway] = useState(true);
  const [upTo, setUpTo] = useState<number | "all">("all");
  const [finished, setFinished] = useState(false);
  const [guide, setGuide] = useState(false);
  const ended = progress >= 1;
  const floors = layout.floors.length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-widest text-ink-soft">{title} · walkthrough</p>
          <h1 className="mt-1 font-serif text-5xl">
            <Decode text={mode === "walk" ? "Walk through your space" : "Look around it"} />
          </h1>
        </div>
        <div role="radiogroup" aria-label="View" className="flex gap-1 rounded-full border border-line p-1">
          {(["walk", "orbit"] as const).map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              onClick={() => {
                setMode(m);
                if (m === "orbit" && !finished) setGuide(true);
              }} className={`rounded-full px-4 py-1.5 text-sm ${mode === m ? "bg-btn text-btn-ink" : "text-ink-soft hover:text-ink"}`}>
              {m === "walk" ? "Walk through" : "Look around"}
            </button>
          ))}
        </div>
      </div>

      {/* Sized to end above the sticky Next bar, so the 3D controls are never hidden under it. */}
      <div className="relative mt-5 h-[calc(100svh-340px)] min-h-[380px] overflow-hidden rounded-2xl border border-line bg-paper-raised">
        <HouseScene
          layout={layout}
          palette={palette}
          mode={mode}
          playing={playing}
          restartKey={restart}
          onRoom={setRoom}
          onProgress={(p) => setProgress((old) => (Math.abs(old - p) > 0.004 || p === 1 ? p : old))}
          cutaway={cutaway}
          upTo={upTo}
          onEnd={() => {
            // When the walk ends, hand over the controls: look around from any angle.
            setPlaying(false);
            setFinished(true);
            setMode("orbit");
            setGuide(true);
          }}
        />
        {mode === "walk" && (
          <>
            <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-paper/85 px-4 py-1.5 font-mono text-sm backdrop-blur">
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
              {room}
            </div>
            <p className="pointer-events-none absolute right-4 top-4 rounded-full bg-paper/85 px-4 py-1.5 text-sm text-ink-soft backdrop-blur">Hold and drag to look around</p>
            <div className="absolute inset-x-4 bottom-4 flex items-center gap-3">
              <button
                onClick={() => {
                  if (ended) {
                    setRestart((r) => r + 1);
                    setProgress(0);
                  }
                  setPlaying((v) => (ended ? true : !v));
                }}
                className="rounded-full bg-btn px-5 py-2 text-sm text-btn-ink"
              >
                {ended ? "Walk again" : playing ? "Pause" : "Play"}
              </button>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper/70">
                <div className="h-full bg-accent transition-[width]" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          </>
        )}
        {mode === "orbit" && (
          <>
            {guide && <MouseGuide finished={finished} onClose={() => setGuide(false)} />}
            <div className="absolute left-4 right-4 top-4 flex flex-wrap items-center gap-2">
              <button onClick={() => setCutaway((c) => !c)} aria-pressed={cutaway} className={`rounded-full px-4 py-1.5 text-sm ${cutaway ? "bg-btn text-btn-ink" : "bg-paper/85 text-ink backdrop-blur"}`}>
                {cutaway ? "Showing inside" : "Show inside"}
              </button>
              {floors > 1 && (
                <div role="radiogroup" aria-label="Floors" className="flex gap-1 rounded-full bg-paper/85 p-1 backdrop-blur">
                  {[...layout.floors.map((f) => f.level), "all" as const].map((l) => (
                    <button key={String(l)} role="radio" aria-checked={upTo === l} onClick={() => setUpTo(l)} className={`rounded-full px-3 py-1 text-sm ${upTo === l ? "bg-btn text-btn-ink" : "text-ink-soft"}`}>
                      {l === "all" ? "All floors" : l === 0 ? "Ground" : "Upstairs"}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setGuide(true)} className="ml-auto rounded-full bg-paper/85 px-4 py-1.5 text-sm text-ink-soft backdrop-blur hover:text-ink">
                How to explore
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// How to move around the 3D model with a mouse, trackpad or touch screen.
function MouseGuide({ finished, onClose }: { finished: boolean; onClose: () => void }) {
  const rows = [
    { icon: "M8 4h8a4 4 0 0 1 4 4v8a8 8 0 0 1-16 0V8a4 4 0 0 1 4-4zM12 4v6", what: "Turn around", how: "Drag with the left mouse button, or one finger" },
    { icon: "M12 3v18M3 12h18M7 7l-4 5 4 5M17 7l4 5-4 5", what: "Move sideways", how: "Drag with the right button, or two fingers" },
    { icon: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5M8 11h6M11 8v6", what: "Zoom in and out", how: "Scroll the wheel, or pinch" },
    { icon: "M3 9l9-6 9 6v11H3zM9 20v-6h6v6", what: "See inside", how: "Show inside lifts the roof; pick a floor to see its rooms" },
  ];
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink/30 p-4 backdrop-blur-[2px]">
      <div role="dialog" aria-label="How to explore" className="w-full max-w-md rounded-2xl border border-line bg-paper-raised p-6 shadow-xl">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-soft">{finished ? "Walk finished" : "Look around"}</p>
        <h2 className="mt-2 font-serif text-3xl">Explore it your way</h2>
        <ul className="mt-5 space-y-4">
          {rows.map((r) => (
            <li key={r.what} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={r.icon} />
                </svg>
              </span>
              <span>
                <span className="block font-medium">{r.what}</span>
                <span className="block text-sm text-ink-soft">{r.how}</span>
              </span>
            </li>
          ))}
        </ul>
        <button onClick={onClose} className="mt-6 w-full rounded-full bg-btn py-3 text-btn-ink">
          Got it
        </button>
      </div>
    </div>
  );
}
