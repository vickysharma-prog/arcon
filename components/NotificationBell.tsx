"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tick } from "./fx/sfx";

type Event = { id: number; project_id: string | null; kind: string; data: { by?: string; text?: string; project?: string | null; room?: string | null }; read: boolean; created_at: string };

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  return m < 1 ? "now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
};

// The bell: what happened on your projects since you last looked. Shown only when signed in.
// ponytail: checks every 30 seconds; Supabase realtime can replace the polling later.
export function NotificationBell() {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(
    () =>
      fetch("/api/events")
        .then((r) => (r.ok ? r.json() : null))
        .then((b) => {
          if (!b) return setEvents(null);
          setEvents(b.events);
          setUnread(b.unread);
        })
        .catch(() => {}),
    [],
  );

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 30_000);
    return () => clearInterval(timer);
  }, [load]);

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

  if (!events) return null;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        onClick={() => {
          tick();
          setOpen((v) => !v);
          if (!open && unread) {
            setUnread(0);
            void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
          }
        }}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-line transition hover:border-accent"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-paper-raised shadow-lg">
          <p className="border-b border-line px-4 py-3 font-medium">Notifications</p>
          {events.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-soft">Nothing yet. Messages and updates on your projects show here.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {events.map((e) => (
                <li key={e.id}>
                  <a href={e.project_id ? `/project/${e.project_id}?tab=thread` : "/home"} className={`block px-4 py-3 text-sm hover:bg-paper ${e.read ? "" : "bg-accent/5"}`}>
                    <p className="flex justify-between gap-2 text-xs text-ink-soft">
                      <span className="truncate">{e.data.project ?? "Your project"}</span>
                      <span>{ago(e.created_at)}</span>
                    </p>
                    <p className="mt-0.5 line-clamp-2">{e.kind === "message" ? `${e.data.by}: ${e.data.text}` : e.data.text}</p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
