"use client";

import { useEffect, useRef, useState } from "react";
import { setSound, soundOn } from "./fx/sfx";

type Mode = "light" | "dark" | "system";
type Me = { user: { id: string; email: string | null } | null; profile?: { name: string; company: string | null } | null };
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

// The profile menu in the header. Settings sit inside it, with Appearance first.
export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [mode, setMode] = useState<Mode>("system");
  const [sound, setSoundState] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => m && setMe(m))
      .catch(() => {});
  }, []);

  async function signOut() {
    await fetch("/api/session", { method: "DELETE" }).catch(() => {});
    window.location.assign("/");
  }

  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setMode(t === "light" || t === "dark" ? t : "system");
    setSoundState(soundOn());
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
        onClick={() => {
          setOpen((v) => !v);
          setSettings(false);
        }}
        aria-label="Your profile"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-full bg-btn text-btn-ink transition hover:opacity-90"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </button>
      {open && (
        <div role="menu" aria-label="Profile" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-paper-raised shadow-lg">
          <div className="border-b border-line px-4 py-3">
            {me?.user ? (
              <>
                <p className="truncate font-medium">{me.profile?.name ?? me.user.email}</p>
                <p className="truncate text-xs text-ink-soft">{me.profile?.company ?? me.user.email}</p>
              </>
            ) : (
              <>
                <p className="font-medium">Guest</p>
                <p className="text-xs text-ink-soft">Your projects are saved in this browser. Sign in to keep them anywhere.</p>
              </>
            )}
          </div>
          {!settings ? (
            <ul className="p-1.5 text-sm">
              {me?.user ? (
                <>
                  <li>
                    <a role="menuitem" href="/home" className="block rounded-xl px-3 py-2 hover:bg-paper">
                      Your projects
                    </a>
                  </li>
                  <li>
                    <a role="menuitem" href="/account" className="block rounded-xl px-3 py-2 hover:bg-paper">
                      Account
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <a role="menuitem" href="/login" className="block rounded-xl px-3 py-2 hover:bg-paper">
                      Sign in
                    </a>
                  </li>
                  <li>
                    <a role="menuitem" href="/login?mode=signup" className="block rounded-xl px-3 py-2 font-medium text-accent hover:bg-paper">
                      Create a free account
                    </a>
                  </li>
                </>
              )}
              <li>
                <button role="menuitem" onClick={() => setSettings(true)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-paper">
                  Settings <span aria-hidden className="text-ink-soft">›</span>
                </button>
              </li>
              {me?.user && (
                <li>
                  <button role="menuitem" onClick={signOut} className="w-full rounded-xl px-3 py-2 text-left text-ink-soft hover:bg-paper hover:text-ink">
                    Sign out
                  </button>
                </li>
              )}
            </ul>
          ) : (
            <div className="p-4">
              <button onClick={() => setSettings(false)} className="text-sm text-ink-soft hover:text-ink">
                ‹ Settings
              </button>
              <p className="mt-3 text-xs uppercase tracking-widest text-ink-soft">Appearance</p>
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
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-ink-soft">Sound effects</p>
                <button
                  role="switch"
                  aria-checked={sound}
                  aria-label="Sound effects"
                  onClick={() => {
                    setSound(!sound);
                    setSoundState(!sound);
                  }}
                  className={`relative h-6 w-11 rounded-full transition ${sound ? "bg-btn" : "bg-line"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper-raised shadow transition-all ${sound ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
