"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useEveAgent } from "eve/react";
import { Mark } from "@/components/Logo";
import { activity, finishedProject, latestTaste, speakable, textOf, type Msg } from "@/lib/interview/view";
import { useListen, useSpeak } from "./useVoice";

export const GREETING = "Hi, I'm Arcon. What are we designing together: a home, a hotel, an office, a café, a shop or a studio?";

export function Interview() {
  const agent = useEveAgent({ agent: "interviewer" });
  const messages = agent.data.messages as unknown as Msg[];
  const busy = agent.status === "submitted" || agent.status === "streaming";
  const [draft, setDraft] = useState("");
  const voice = useSpeak();
  const spoken = useRef(new Set<string>());
  const bottom = useRef<HTMLDivElement>(null);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    voice.stop();
    setDraft("");
    void agent.send(t);
  };
  const listen = useListen(send);

  // Speak each assistant message once, when it has finished streaming.
  useEffect(() => {
    if (busy) return;
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (last && !spoken.current.has(last.id)) {
      spoken.current.add(last.id);
      voice.speak(speakable(textOf(last)));
    }
  }, [busy, messages, voice]);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [messages.length, busy]);

  const taste = latestTaste(messages);
  const projectId = finishedProject(messages);

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 pb-6 lg:grid-cols-[1fr_320px]">
      <section className="flex min-h-[70vh] flex-col rounded-2xl border border-line bg-paper-raised">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="text-sm text-ink-soft">Your interview, about 8 minutes</p>
          <button
            type="button"
            onClick={voice.toggle}
            className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft hover:text-ink"
            aria-pressed={voice.on}
          >
            {voice.on ? "Voice on" : "Voice off"}
          </button>
        </div>

        <ol className="flex-1 space-y-5 overflow-y-auto px-5 py-6" aria-live="polite">
          <li>
            <Bubble role="assistant" text={GREETING} />
          </li>
          {messages.map((m) => (
            <li key={m.id} className="space-y-2">
              {m.role === "assistant" &&
                activity(m).map((a, i) => (
                  <p key={i} className="flex items-center gap-2 text-xs text-ink-soft">
                    <span className={`h-1.5 w-1.5 rounded-full ${a.working ? "animate-pulse bg-clay" : "bg-leaf"}`} />
                    {a.label}
                  </p>
                ))}
              {textOf(m) && <Bubble role={m.role} text={textOf(m)} />}
            </li>
          ))}
          {agent.status === "submitted" && <p className="text-sm text-ink-soft">Thinking…</p>}
          {agent.error && <p className="text-sm text-clay">Something went wrong. Please try again in a moment.</p>}
          <div ref={bottom} />
        </ol>

        {projectId ? (
          <div className="border-t border-line p-5 text-center">
            <Link href={`/project/${projectId}`} className="inline-block rounded-full bg-ink px-6 py-3 text-paper">
              See your design
            </Link>
          </div>
        ) : (
          <form
            className="flex items-end gap-2 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <textarea
              value={listen.listening ? listen.interim || "Listening…" : draft}
              onChange={(e) => setDraft(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(draft);
                }
              }}
              rows={2}
              placeholder="Type, or press the mic and talk"
              aria-label="Your answer"
              className="min-h-12 flex-1 resize-none rounded-xl border border-line bg-paper px-3 py-2 outline-none focus:border-ink-soft"
            />
            {listen.supported && (
              <button
                type="button"
                onClick={listen.listening ? listen.stop : listen.start}
                aria-label={listen.listening ? "Stop listening" : "Talk"}
                className={`h-12 w-12 rounded-full border border-line ${listen.listening ? "animate-pulse bg-clay text-paper" : "text-ink"}`}
              >
                🎙
              </button>
            )}
            <button type="submit" disabled={busy || !draft.trim()} className="h-12 rounded-full bg-ink px-5 text-paper disabled:opacity-40">
              Send
            </button>
          </form>
        )}
      </section>

      <aside className="rounded-2xl border border-line bg-paper-raised p-5 lg:sticky lg:top-6 lg:self-start">
        <div className="flex items-center gap-2">
          <Mark size={22} />
          <h2 className="font-serif text-2xl">Your taste so far</h2>
        </div>
        {taste ? (
          <>
            <p className="mt-1 text-xs text-ink-soft">From {taste.count} things you love</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {taste.style.map((s) => (
                <li key={s.word} title={`From ${s.from.join(", ")}`} className="rounded-full bg-paper px-3 py-1 text-sm capitalize">
                  {s.word}
                </li>
              ))}
            </ul>
            {taste.brands.length > 0 && (
              <>
                <h3 className="mt-5 text-xs uppercase tracking-widest text-ink-soft">Brands that match</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {taste.brands.map((b) => (
                    <li key={b.name}>
                      <span className="font-medium">{b.name}</span>
                      {b.look.length > 0 && <span className="text-ink-soft">: {b.look.join(", ")}</span>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            As you name places, brands, films and music you love, your style appears here.
          </p>
        )}
      </aside>
    </div>
  );
}

function Bubble({ role, text }: { role: "assistant" | "user"; text: string }) {
  return role === "assistant" ? (
    <p className="max-w-[85%] whitespace-pre-wrap text-lg leading-relaxed">{text}</p>
  ) : (
    <p className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl bg-ink px-4 py-2 text-paper">{text}</p>
  );
}
