"use client";

// Interface sounds made live with Web Audio: no files to download. Quiet by design.
// Browsers only allow sound after the user has interacted with the page, so the context starts
// on the first click or key press and every sound before that is skipped silently.

const KEY = "arcon-sound";
let ctx: AudioContext | null = null;
let lastTick = 0;

export function soundOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSound(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
}

function audio(): AudioContext | null {
  if (typeof window === "undefined" || !soundOn()) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx.state === "running" ? ctx : null;
}

// Wake the audio context on the first user gesture anywhere on the page.
if (typeof window !== "undefined") {
  const wake = () => audio();
  window.addEventListener("pointerdown", wake, { passive: true });
  window.addEventListener("keydown", wake);
}

function tone(freq: number, ms: number, { type = "square" as OscillatorType, gain = 0.025, to }: { type?: OscillatorType; gain?: number; to?: number } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + ms / 1000);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + ms / 1000 + 0.02);
}

// A short data blip for each burst of typed characters. Throttled so fast typing stays a texture, not noise.
export function tick() {
  const now = performance.now();
  if (now - lastTick < 45) return;
  lastTick = now;
  tone(1700 + Math.random() * 900, 14, { gain: 0.018 });
}

// A two-note "ok" when a log line finishes.
export function ok() {
  tone(880, 40, { type: "sine", gain: 0.03 });
  setTimeout(() => tone(1320, 50, { type: "sine", gain: 0.03 }), 45);
}

// A rising sweep when the screen moves to a new step.
export function whoosh() {
  tone(180, 260, { type: "sine", gain: 0.04, to: 720 });
}

// A soft chord when the design is ready.
export function chime() {
  [523.25, 659.25, 783.99].forEach((f, i) => setTimeout(() => tone(f, 420, { type: "sine", gain: 0.035 }), i * 70));
}
