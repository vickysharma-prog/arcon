"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEveAgent } from "eve/react";
import { Mark } from "@/components/Logo";
import { AnimatedMark } from "@/components/AnimatedMark";
import { Decode } from "@/components/fx/Decode";
import { tick } from "@/components/fx/sfx";
import { activity, finishedProject, joinPicks, latestTaste, pendingChoices, speakable, STAGES, stageReached, textOf, type Msg } from "@/lib/interview/view";
import { LANGS, langOf, STARTERS, voiceFor, type LangId } from "@/lib/interview/lang";
import { useListen, useMicLevel, useSpeak } from "./useVoice";
import { VoiceMode, type VoiceState } from "./VoiceMode";

const LANG_KEY = "arcon-lang";

// The first thing a visitor does: tell Arcon what they're designing, by typing or by talking. A live rail shows
// how far the interview has got; a voice mode turns it into a conversation; the taste card fills in as they go.
export function Interview() {
  const agent = useEveAgent({ agent: "interviewer" });
  const messages = agent.data.messages as unknown as Msg[];
  const busy = agent.status === "submitted" || agent.status === "streaming";
  const still = useReducedMotion();
  const [draft, setDraft] = useState("");
  const [lang, setLang] = useState<LangId>("en");
  const [talking, setTalking] = useState(false);
  const [picks, setPicks] = useState<string[]>([]);
  const spoken = useRef(new Set<string>());
  const list = useRef<HTMLOListElement>(null);
  const greeting = langOf(lang).greeting;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved) setLang(langOf(saved).id);
    } catch {}
  }, []);

  const send = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || busy) return;
      setDraft("");
      void agent.send(t);
    },
    [agent, busy],
  );
  const listen = useListen(send, langOf(lang).listen);
  // In voice mode, Arcon listens again as soon as it finishes speaking, so the talk flows without taps.
  const voice = useSpeak(() => {
    if (talking) listen.start();
  });

  // Greet out loud once, in the chosen language. The click that opened this page allows the browser to speak.
  useEffect(() => {
    if (messages.length || spoken.current.has(`greeting-${lang}`)) return;
    spoken.current.add(`greeting-${lang}`);
    voice.speak(greeting, voiceFor(greeting, lang));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Speak each assistant message once, when it has finished streaming.
  useEffect(() => {
    if (busy) return;
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (last && !spoken.current.has(last.id)) {
      spoken.current.add(last.id);
      const text = speakable(textOf(last));
      if (!voice.speak(text, voiceFor(text, lang)) && talking) listen.start();
    }
  }, [busy, messages, voice, lang, talking, listen]);

  // The chat box keeps its size and scrolls inside; the page itself never moves.
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // A turn that fails, ends without a reply, or goes quiet for 45 seconds gets a visible "Try again".
  const [quiet, setQuiet] = useState(false);
  useEffect(() => {
    setQuiet(false);
    if (!busy) return;
    const t = setTimeout(() => setQuiet(true), 45_000);
    return () => clearTimeout(t);
  }, [busy, messages]);
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const stuck = agent.status === "error" || quiet || (agent.status === "ready" && messages.at(-1)?.role === "user");
  const retry = () => {
    if (!lastUser) return;
    setQuiet(false);
    void agent.send(textOf(lastUser), busy ? { turnPolicy: "steer" } : undefined);
  };

  const level = useMicLevel(talking && listen.listening);
  const taste = latestTaste(messages);
  const projectId = finishedProject(messages);
  const stage = stageReached(messages);
  const offer = busy ? null : pendingChoices(messages);
  // A new question clears what was ticked for the last one.
  const offerKey = offer ? offer.choices.join("|") : "";
  useEffect(() => setPicks([]), [offerKey]);
  const lastReply = textOf([...messages].reverse().find((m) => m.role === "assistant") ?? { id: "", role: "assistant", parts: [] }) || greeting;
  const voiceState: VoiceState = listen.listening ? "listening" : busy ? "thinking" : voice.speaking ? "speaking" : "idle";

  const pickLang = (id: LangId) => {
    tick();
    setLang(id);
    try {
      localStorage.setItem(LANG_KEY, id);
    } catch {}
  };
  const openVoice = () => {
    tick();
    voice.stop();
    setTalking(true);
    listen.start();
  };
  const closeVoice = () => {
    setTalking(false);
    listen.stop();
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8">
      {/* live strip: what this is, how far along, which language */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-ink-soft">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Arcon · interview · live
        </p>
        <div role="radiogroup" aria-label="Language" className="flex gap-1 rounded-full border border-line bg-paper-raised p-1">
          {LANGS.map((l) => (
            <button
              key={l.id}
              role="radio"
              aria-checked={lang === l.id}
              onClick={() => pickLang(l.id)}
              className={`relative rounded-full px-3 py-1 text-sm transition-colors ${lang === l.id ? "text-btn-ink" : "text-ink-soft hover:text-ink"}`}
            >
              {lang === l.id && <motion.span layoutId="lang-pill" className="absolute inset-0 rounded-full bg-btn" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative">{l.label}</span>
            </button>
          ))}
        </div>
      </div>
      <ol className="mb-5 grid grid-cols-5 gap-2" aria-label={`Interview progress: ${stage} of ${STAGES.length}`}>
        {STAGES.map((s, i) => (
          <li key={s}>
            <div className="h-1 overflow-hidden rounded-full bg-line">
              <motion.div className="h-1 rounded-full bg-gradient-to-r from-btn to-accent" initial={false} animate={{ width: i < stage ? "100%" : i === stage ? "35%" : "0%" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
            </div>
            <p className={`mt-1.5 text-[11px] uppercase tracking-wider ${i <= stage ? "text-ink" : "text-ink-soft"}`}>{s}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="relative flex h-[68vh] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-paper-raised shadow-[0_30px_80px_-50px_var(--accent)]">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <p className="text-sm text-ink-soft">About 8 minutes. Type or talk.</p>
            <button type="button" onClick={voice.toggle} className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft transition hover:border-accent hover:text-ink" aria-pressed={voice.on}>
              {voice.on ? "🔊 Voice on" : "🔇 Voice off"}
            </button>
          </div>

          <ol ref={list} className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-6" aria-live="polite">
            <li className="flex gap-3">
              <Avatar busy={false} />
              <p key={lang} className="max-w-[85%] text-lg leading-relaxed">
                <Decode text={greeting} speed={18} />
              </p>
            </li>
            {messages.length === 0 && (
              <motion.li initial={still ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="flex flex-wrap gap-2 pl-11">
                {STARTERS[lang].map((s, i) => (
                  <motion.button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    initial={still ? false : { opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.3 + i * 0.06, type: "spring", stiffness: 400, damping: 22 }}
                    whileHover={still ? undefined : { y: -2 }}
                    className="rounded-full border border-line bg-paper px-4 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
                  >
                    {s}
                  </motion.button>
                ))}
              </motion.li>
            )}
            {messages.map((m, idx) => (
              <motion.li key={m.id} initial={still ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                {m.role === "assistant" && activity(m).length > 0 && (
                  <ul className="space-y-1 pl-11 font-mono text-xs text-ink-soft">
                    {activity(m).map((a, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={a.working ? "text-accent" : "text-leaf"}>{a.working ? "›" : "✓"}</span>
                        <span className={a.working ? "animate-pulse" : ""}>{a.label}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {textOf(m) &&
                  (m.role === "assistant" ? (
                    <div className="flex gap-3">
                      <Avatar busy={busy && idx === messages.length - 1} />
                      <p className="max-w-[85%] whitespace-pre-wrap text-lg leading-relaxed">{textOf(m)}</p>
                    </div>
                  ) : (
                    <p className="ml-auto max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-btn px-4 py-2 text-btn-ink">{textOf(m)}</p>
                  ))}
              </motion.li>
            ))}
            {offer && offer.choices.length > 0 && (
              <li className="pl-11">
                <div className="flex flex-wrap gap-2">
                  {offer.choices.map((c, i) => {
                    const on = picks.includes(c);
                    return (
                      <motion.button
                        key={c}
                        type="button"
                        aria-pressed={offer.multi ? on : undefined}
                        onClick={() => {
                          tick();
                          if (offer.multi) setPicks((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
                          else send(c);
                        }}
                        initial={still ? false : { opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 22 }}
                        whileHover={still ? undefined : { y: -2 }}
                        className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${on ? "border-accent bg-accent text-btn-ink" : "border-line bg-paper hover:border-accent hover:text-accent"}`}
                      >
                        {offer.multi && <span className="mr-1">{on ? "✓" : "+"}</span>}
                        {c}
                      </motion.button>
                    );
                  })}
                  {offer.multi && (
                    <button
                      type="button"
                      disabled={!picks.length}
                      onClick={() => send(joinPicks(picks))}
                      className="rounded-full bg-btn px-4 py-1.5 text-sm text-btn-ink transition hover:opacity-90 disabled:opacity-40"
                    >
                      {lang === "hi" ? "हो गया" : lang === "hinglish" ? "Ho gaya" : "Done"} →
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-ink-soft">{lang === "hi" ? "या नीचे अपना जवाब लिखें" : lang === "hinglish" ? "Ya neeche apna jawab likho" : "Or type your own answer below"}</p>
              </li>
            )}
            {agent.status === "submitted" && (
              <li className="flex items-center gap-3">
                <Avatar busy />
                <span className="flex gap-1" aria-label="Arcon is thinking">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="h-2 w-2 rounded-full bg-accent" animate={still ? {} : { y: [0, -5, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </span>
              </li>
            )}
            {stuck && lastUser && (
              <li className="flex flex-wrap items-center gap-3 pl-11 text-sm">
                <span className="text-ink-soft">{lang === "hi" ? "जवाब नहीं आया।" : lang === "hinglish" ? "Jawab nahi aaya." : "Arcon didn't answer that one."}</span>
                <button type="button" onClick={retry} className="rounded-full border border-accent px-4 py-1.5 text-accent transition hover:bg-accent hover:text-btn-ink">
                  {lang === "hi" ? "फिर से कोशिश करें" : lang === "hinglish" ? "Phir try karo" : "Try again"}
                </button>
              </li>
            )}
          </ol>

          {projectId ? (
            <div className="border-t border-line p-5 text-center">
              <Link href={`/project/${projectId}`} className="inline-block rounded-full bg-btn px-7 py-3 text-lg text-btn-ink shadow-[0_10px_40px_-12px_var(--accent)] transition hover:opacity-90">
                See your design →
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
                value={draft}
                onChange={(e) => setDraft(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                rows={2}
                placeholder={offer?.hint ?? (lang === "hi" ? "लिखें, या माइक दबाकर बोलें" : lang === "hinglish" ? "Likho, ya mic dabake bolo" : "Type, or press the mic and talk")}
                aria-label="Your answer"
                className="min-h-12 flex-1 resize-none rounded-xl border border-line bg-paper px-3 py-2 outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_20%,transparent)]"
              />
              {listen.supported && (
                <motion.button
                  type="button"
                  onClick={openVoice}
                  whileTap={still ? undefined : { scale: 0.92 }}
                  aria-label="Talk to Arcon"
                  className="relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-accent to-btn text-btn-ink shadow-[0_8px_30px_-10px_var(--accent)]"
                >
                  <span className="absolute inset-0 animate-ping rounded-full bg-accent/30 motion-reduce:hidden" />
                  <MicIcon />
                </motion.button>
              )}
              <button type="submit" disabled={busy || !draft.trim()} className="h-12 rounded-full bg-btn px-5 text-btn-ink transition hover:opacity-90 disabled:opacity-40">
                Send
              </button>
            </form>
          )}

          <AnimatePresence>
            {talking && !projectId && <VoiceMode state={voiceState} level={level} heard={listen.interim} reply={lastReply} onOrb={listen.listening ? listen.stop : () => { voice.stop(); listen.start(); }} onClose={closeVoice} />}
          </AnimatePresence>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <FloorPlanCard />
          <div className="rounded-2xl border border-line bg-paper-raised p-5">
            <div className="flex items-center gap-2">
              <Mark size={22} />
              <h2 className="font-serif text-2xl">Your taste so far</h2>
            </div>
            {taste ? (
              <>
                <p className="mt-1 text-xs text-ink-soft">From {taste.count} things you love, read through Qloo&apos;s taste graph</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {taste.style.map((s, i) => (
                    <motion.li
                      key={s.word}
                      initial={still ? false : { opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 22, delay: i * 0.06 }}
                      title={`From ${s.from.join(", ")}`}
                      className="rounded-full bg-paper px-3 py-1 text-sm capitalize"
                    >
                      {s.word}
                    </motion.li>
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
              <p className="mt-3 text-sm text-ink-soft">As you name places, brands, films and music you love, your style appears here.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// Arcon's mark, on its own: no circle or box behind it. Its seeds grow while Arcon thinks.
function Avatar({ busy }: { busy: boolean }) {
  return <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center">{busy ? <AnimatedMark size={28} /> : <Mark size={26} />}</span>;
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="relative">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

// The way in for people who already have plans: a blueprint that draws itself, and a clear call to upload.
function FloorPlanCard() {
  const still = useReducedMotion();
  const draw = (d: number) => (still ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 1.6, delay: d, ease: "easeInOut" as const } });
  return (
    <Link
      href="/start/plan"
      className="group relative block overflow-hidden rounded-2xl border border-accent/40 bg-paper-raised p-5 transition hover:border-accent hover:shadow-[0_18px_50px_-24px_var(--accent)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      />
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent animate-[edge_2.4s_linear_infinite] motion-reduce:animate-none" />
      <div className="relative flex items-start gap-4">
        <svg width="64" height="52" viewBox="0 0 64 52" fill="none" stroke="var(--accent)" strokeWidth="1.6" aria-hidden className="shrink-0">
          <motion.path d="M2 2h60v48H2z" {...draw(0)} />
          <motion.path d="M30 2v22H2M30 24h32M44 24v26M16 24v26" {...draw(0.4)} />
          <motion.path d="M22 50v-6M38 2v6" stroke="var(--leaf)" {...draw(1)} />
        </svg>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">Skip the questions</p>
          <p className="mt-1 font-serif text-xl leading-tight">Already have a floor plan?</p>
          <p className="mt-1 text-sm text-ink-soft">Upload a photo, scan or PDF. Arcon reads every room in seconds.</p>
          <p className="mt-2 text-sm font-medium text-accent">
            Upload your plan <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
