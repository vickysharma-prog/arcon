"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "light" | "dark" | "system";
const KEY = "arcon-theme";

function apply(mode: Mode) {
  const root = document.documentElement;
  try {
    if (mode === "system") {
      delete root.dataset.theme;
      localStorage.removeItem(KEY);
    } else {
      root.dataset.theme = mode;
      localStorage.setItem(KEY, mode);
    }
  } catch {}
}

// Settings live behind one gear icon. Appearance first; more preferences join it later.
export function Settings() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("system");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setMode(t === "light" || t === "dark" ? t : "system");
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const choose = (m: Mode) => {
    apply(m);
    setMode(m);
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-soft transition hover:text-ink"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </button>
      {open && (
        <div role="dialog" aria-label="Settings" className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-line bg-paper-raised p-4 shadow-lg">
          <p className="text-xs uppercase tracking-widest text-ink-soft">Appearance</p>
          <div role="radiogroup" aria-label="Appearance" className="mt-2 grid grid-cols-3 gap-1 rounded-full border border-line p-1">
            {(["light", "dark", "system"] as const).map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={mode === m}
                onClick={() => choose(m)}
                className={`rounded-full px-2 py-1.5 text-sm capitalize transition ${mode === m ? "bg-btn text-btn-ink" : "text-ink-soft hover:text-ink"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
