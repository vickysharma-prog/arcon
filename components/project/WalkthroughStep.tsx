"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { Decode } from "@/components/fx/Decode";
import type { Layout } from "@/lib/layout/schema";
import type { Mode, Pose } from "@/components/three/HouseScene";
import { PlanSvg } from "@/components/plan/PlanSvg";
import { look as lookOf } from "@/lib/three/materials";

type SceneProps = ComponentProps<typeof import("@/components/three/HouseScene").default>;

const STYLE_NAME = { midcentury: "Mid-century", industrial: "Industrial", scandi: "Scandinavian", boho: "Boho", classic: "Classic", modern: "Modern" } as const;

// three.js needs the browser, so the scene loads on the client only.
const HouseScene = dynamic(() => import("@/components/three/HouseScene"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center font-mono text-sm text-ink-soft">&gt; building your 3D model…</div>,
});

export function WalkthroughStep({ layout, brief, taste, title }: { layout: Layout; brief?: SceneProps["brief"]; taste?: SceneProps["taste"]; title?: string | null }) {
  const [mode, setMode] = useState<Mode>("walk");
  const [playing, setPlaying] = useState(true);
  const [room, setRoom] = useState("Outside");
  const [progress, setProgress] = useState(0);
  const [restart, setRestart] = useState(0);
  const [cutaway, setCutaway] = useState(true);
  const [upTo, setUpTo] = useState<number | "all">("all");
  const [finished, setFinished] = useState(false);
  const [guide, setGuide] = useState(false);
  const [fitKey, setFitKey] = useState(0);
  const [full, setFull] = useState(false);
  const [level, setLevel] = useState(0);
  const [pose, setPose] = useState<Pose | null>(null);
  const [go, setGo] = useState<{ x: number; z: number; key: number }>();
  const box = useRef<HTMLDivElement>(null);
  const style = useMemo(() => lookOf(brief, taste), [brief, taste]);
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === box.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : box.current?.requestFullscreen())?.catch(() => {});
  const ended = progress >= 1;
  const floors = layout.floors.length;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-widest text-ink-soft">{title} · walkthrough</p>
          <h1 className="mt-1 font-serif text-5xl">
            <Decode text={mode === "walk" ? "Walk through your space" : mode === "explore" ? "Explore inside" : "Look around it"} />
          </h1>
        </div>
        <div role="radiogroup" aria-label="View" className="flex gap-1 rounded-full border border-line p-1">
          {(["walk", "explore", "orbit"] as const).map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              onClick={() => {
                setMode(m);
                if (m === "orbit" && !finished) setGuide(true);
              }} className={`rounded-full px-4 py-1.5 text-sm ${mode === m ? "bg-btn text-btn-ink" : "text-ink-soft hover:text-ink"}`}>
              {m === "walk" ? "Walk through" : m === "explore" ? "Explore inside" : "Look around"}
            </button>
          ))}
        </div>
      </div>

      {/* Sized to end above the sticky Next bar, so the 3D controls are never hidden under it. */}
      <p className="mt-2 text-sm text-ink-soft">
        Furnished in a <span className="font-medium text-ink">{STYLE_NAME[style.style]}</span> style
        {style.because.length > 0 && <> because you love {style.because.join(", ")}</>}.
      </p>
      <div ref={box} className={`relative mt-4 overflow-hidden border-line bg-paper-raised ${full ? "h-screen" : "h-[calc(100svh-330px)] min-h-[420px] rounded-2xl border"}`}>
        <HouseScene
          layout={layout}
          brief={brief}
          taste={taste}
          fitKey={fitKey}
          mode={mode}
          playing={playing}
          restartKey={restart}
          onRoom={setRoom}
          onProgress={(p) => setProgress((old) => (Math.abs(old - p) > 0.004 || p === 1 ? p : old))}
          cutaway={cutaway}
          upTo={upTo}
          level={level}
          go={go}
          onPose={setPose}
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
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <p className="pointer-events-none rounded-full bg-paper/85 px-4 py-1.5 text-sm text-ink-soft backdrop-blur">Hold and drag to look around</p>
              <FullButton full={full} onClick={toggleFull} />
            </div>
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
        {mode === "explore" && (
          <>
            <div className="absolute left-4 right-4 top-4 z-30 flex flex-wrap items-center gap-2">
              <div className="pointer-events-none rounded-full bg-paper/85 px-4 py-1.5 font-mono text-sm backdrop-blur">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-leaf" />
                {room}
              </div>
              {floors > 1 && (
                <div role="radiogroup" aria-label="Floor" className="flex gap-1 rounded-full bg-paper/85 p-1 backdrop-blur">
                  {layout.floors.map((f) => (
                    <button key={f.level} role="radio" aria-checked={level === f.level} onClick={() => setLevel(f.level)} className={`rounded-full px-3 py-1 text-sm ${level === f.level ? "bg-btn text-btn-ink" : "text-ink-soft"}`}>
                      {f.level === 0 ? "Ground" : "Upstairs"}
                    </button>
                  ))}
                </div>
              )}
              <p className="pointer-events-none ml-auto hidden rounded-full bg-paper/85 px-4 py-1.5 text-sm text-ink-soft backdrop-blur md:block">
                W A S D or arrows to move · click the floor to walk there · drag to look
              </p>
              <FullButton full={full} onClick={toggleFull} />
            </div>
            {/* Mini-map: where you are and which way you face; click it to jump there. */}
            <div className="absolute bottom-4 right-4 z-30 w-56 rounded-xl border border-line bg-paper/90 p-2 shadow-lg backdrop-blur">
              <PlanSvg layout={layout} level={level} className="h-auto w-full cursor-pointer" onPick={(x, z) => setGo({ x, z, key: Date.now() })}>
                {pose && pose.level === level && (
                  <g transform={`translate(${pose.x} ${pose.z}) rotate(${(-pose.yaw * 180) / Math.PI})`}>
                    <path d="M0 0 L-0.9 1.6 A1.8 1.8 0 0 0 0.9 1.6 Z" className="fill-accent" opacity={0.25} />
                    <circle r={0.3} className="fill-accent stroke-paper" strokeWidth={0.08} />
                  </g>
                )}
              </PlanSvg>
              <p className="mt-1 text-center text-[11px] text-ink-soft">Click the map to jump</p>
            </div>
          </>
        )}
        {mode === "orbit" && (
          <>
            {guide && <MouseGuide finished={finished} onClose={() => setGuide(false)} />}
            <div className="absolute left-4 right-4 top-4 z-30 flex flex-wrap items-center gap-2">
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
              <button onClick={() => setFitKey((k) => k + 1)} className="rounded-full bg-paper/85 px-4 py-1.5 text-sm text-ink backdrop-blur hover:bg-paper">
                Whole house
              </button>
              <button onClick={() => setGuide(true)} className="ml-auto rounded-full bg-paper/85 px-4 py-1.5 text-sm text-ink-soft backdrop-blur hover:text-ink">
                How to explore
              </button>
              <FullButton full={full} onClick={toggleFull} />
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
    { icon: "M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", what: "Visit a room", how: "Click a room's name to fly in; Whole house steps back out" },
  ];
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-ink/30 p-4 backdrop-blur-[2px]">
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

function FullButton({ full, onClick }: { full: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={full ? "Exit full screen" : "Full screen"} title={full ? "Exit full screen" : "Full screen"} className="grid h-9 w-9 place-items-center rounded-full bg-paper/85 text-ink backdrop-blur hover:bg-paper">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={full ? "M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" : "M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"} />
      </svg>
    </button>
  );
}
