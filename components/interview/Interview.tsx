"use client";

import { QUIZ_KEY } from "@/lib/quiz/picks";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Mark } from "@/components/Logo";
import { AnimatedMark } from "@/components/AnimatedMark";
import { tick, transition } from "@/components/fx/sfx";
import { Decode, TypeLog } from "@/components/fx/Decode";
import { STAGES, type TasteView } from "@/lib/interview/view";
import { LANGS, langOf, voiceFor, type LangId } from "@/lib/interview/lang";
import { asked, labelOf, matchChoices, next, picksOf, type Answer, type Answers, type Question, type TastePick } from "@/lib/interview/script";
import { sizeFrom } from "@/lib/interview/logic";
import type { Candidate } from "@/lib/interview/logic";
import { useListen, useMicLevel, useSpeak } from "./useVoice";
import { VoiceMode, type VoiceState } from "./VoiceMode";

const LANG_KEY = "arcon-lang";
type Look = { matches: Candidate[]; hint: string | null } | { error: string };

// Small words the screen says, in the three languages.
const SAY = {
  havePlan: { en: "Have a floor plan? Upload it", hi: "फ़्लोर प्लान है? अपलोड करें", hinglish: "Floor plan hai? Upload karo" },
  title: { en: "Let's get to know you", hi: "आइए आपको जानें", hinglish: "Chalo aapko jaante hain" },
  keys: { en: "Press 1–9 to pick", hi: "चुनने के लिए 1–9 दबाएँ", hinglish: "Chunne ke liye 1–9 dabao" },
  building: { en: "Reading your taste", hi: "आपकी पसंद समझ रहे हैं", hinglish: "Aapki pasand samajh rahe hain" },
  ready: { en: "Your profile is ready", hi: "आपकी प्रोफ़ाइल तैयार है", hinglish: "Aapki profile ready hai" },
  tasteTitle: { en: "Your taste so far", hi: "अब तक आपकी पसंद", hinglish: "Ab tak aapki pasand" },
  tasteEmpty: { en: "Name a place, a brand and a film or music you love, and your style appears here.", hi: "कोई जगह, ब्रांड और फ़िल्म या संगीत बताइए, आपकी स्टाइल यहाँ दिखेगी।", hinglish: "Koi jagah, brand aur film ya music batao, aapka style yahan dikhega." },
  done: { en: "Done", hi: "हो गया", hinglish: "Ho gaya" },
  skip: { en: "Skip", hi: "छोड़ें", hinglish: "Skip" },
  back: { en: "Change last answer", hi: "पिछला जवाब बदलें", hinglish: "Pichla jawab badlo" },
  tapOne: { en: "Tap one of the answers above, or say it another way.", hi: "ऊपर किसी जवाब पर टैप करें, या दूसरे तरीके से कहें।", hinglish: "Upar koi jawab tap karo, ya alag tarah se bolo." },
  type: { en: "Type, or press the mic and talk", hi: "लिखें, या माइक दबाकर बोलें", hinglish: "Likho, ya mic dabake bolo" },
  orType: { en: "Or type your answer below", hi: "या नीचे अपना जवाब लिखें", hinglish: "Ya neeche apna jawab likho" },
  notSure: { en: "Not sure, use a typical size", hi: "पता नहीं, आम साइज़ लें", hinglish: "Pata nahi, typical size le lo" },
  width: { en: "Width", hi: "चौड़ाई", hinglish: "Width" },
  depth: { en: "Depth", hi: "गहराई", hinglish: "Depth" },
  looking: { en: "Looking it up in Qloo…", hi: "Qloo में ढूँढ रहे हैं…", hinglish: "Qloo mein dhoondh rahe hain…" },
  found: { en: "We found", hi: "हमें मिला", hinglish: "Humein mila" },
  thatsIt: { en: "Yes, that's it", hi: "हाँ, यही", hinglish: "Haan, yehi" },
  notIt: { en: "Not it?", hi: "यह नहीं?", hinglish: "Yeh nahi?" },
  see: { en: "See your design →", hi: "अपना डिज़ाइन देखें →", hinglish: "Apna design dekho →" },
  retry: { en: "Try again", hi: "फिर से कोशिश करें", hinglish: "Phir try karo" },
} satisfies Record<string, Record<LangId, string>>;

// "Let's get to know you": the first thing a visitor does. One question at a time sits in the middle of the
// screen; each answer is a tap, a few typed words or a sentence spoken aloud, and the next question appears at
// once, since nothing waits on a model. The taste questions are matched in Qloo as they type, and the taste card
// fills in beside them. The design itself runs after, on the project page.
export function Interview() {
  const still = useReducedMotion();
  const [lang, setLang] = useState<LangId>("en");
  const [answers, setAnswers] = useState<Answers>({});
  const [draft, setDraft] = useState("");
  const [nudge, setNudge] = useState(false);
  const [talking, setTalking] = useState(false);
  const [finishing, setFinishing] = useState<"idle" | "working" | "failed">("idle");
  const [failure, setFailure] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [taste, setTaste] = useState<TasteView | null>(null);
  const spoken = useRef(new Set<string>());
  // Answering for a project a pro set up ("New client"): its id, and whose it is.
  const [into, setInto] = useState<{ id: string; whose: string | null } | null>(null);
  const q = next(answers);
  const say = (k: keyof typeof SAY) => SAY[k][lang];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved) setLang(langOf(saved).id);
    } catch {}
    // Coming from the taste quiz: its three picks answer the taste questions (the place, the brand, the film or music).
    try {
      const quiz = JSON.parse(sessionStorage.getItem(QUIZ_KEY) ?? "null") as { slot: string; id: string; name: string }[] | null;
      sessionStorage.removeItem(QUIZ_KEY);
      if (Array.isArray(quiz)) {
        const from = Object.fromEntries(quiz.filter((p) => p && typeof p.id === "string").map((p) => [p.slot, { slot: p.slot, id: p.id, name: String(p.name) }]));
        setAnswers((a) => ({ ...from, ...a }) as Answers);
      }
    } catch {}
    // /start?project=… fills that project; the type and city the pro already gave are answered.
    const id = new URLSearchParams(location.search).get("project");
    if (!id) return;
    fetch(`/api/projects/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!p || p.status !== "interview") return;
        setInto({ id, whose: p.whose ?? p.designed_for ?? null });
        setAnswers((a) => ({ ...(p.space_type ? { type: p.space_type } : {}), ...(p.site?.location ? { city: p.site.location } : {}), ...a }));
      })
      .catch(() => {});
  }, []);

  const answer = useCallback(
    (id: string, value: Answer) => {
      tick();
      setNudge(false);
      setDraft("");
      setAnswers((a) => ({ ...a, [id]: value }));
    },
    [],
  );

  // A typed or spoken answer: matched to a choice, read as a size, or taken as it is.
  const submit = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!q || !t) return;
      if (q.kind === "choice" || q.kind === "multi") {
        const hit = matchChoices(t, q);
        if (hit.length) answer(q.id, q.kind === "choice" ? hit[0] : hit);
        else setNudge(true);
      } else if (q.kind === "size") {
        if (/not sure|pata nahi|पता नहीं|typical|don.?t know/i.test(t)) return answer(q.id, { typical: true });
        const s = sizeFrom(t);
        if (s.width && s.depth) answer(q.id, { width: s.width, depth: s.depth, unit: s.unit ?? "ft" });
        else setNudge(true);
      } else if (q.kind === "text") {
        answer(q.id, t.slice(0, 200));
      } else {
        setDraft(t); // taste: the lookup below runs on the draft
      }
    },
    [q, answer],
  );

  const listen = useListen(submit, langOf(lang).listen);
  const voice = useSpeak(() => {
    if (talking) listen.start();
  });

  // Each question is read aloud once, in the chosen language.
  const askText = q ? [q.lead?.[lang], q.ask[lang]].filter(Boolean).join(" ") : "";
  useEffect(() => {
    if (!q || spoken.current.has(`${q.id}-${lang}`)) return;
    spoken.current.add(`${q.id}-${lang}`);
    if (!voice.speak(askText, voiceFor(askText, lang)) && talking) listen.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.id, lang]);

  // The live taste card: each new pick is read through Qloo while the next question is already on screen.
  const picks = picksOf(answers);
  const pickKey = picks.map((p) => p.id).join("|");
  useEffect(() => {
    if (!picks.length) return setTaste(null);
    let live = true;
    void fetch("/api/interview/taste", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ picks }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((t) => live && t && setTaste(t))
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickKey]);

  // All answered: confirm the picks with Qloo and create the project. The design itself runs on the next page.
  const finish = useCallback(async () => {
    setFinishing("working");
    transition();
    try {
      const res = await fetch("/api/interview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, lang, projectId: into?.id }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.id) throw new Error(body.error ?? "We couldn't start your design.");
      setProjectId(body.id);
      setFinishing("idle");
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "We couldn't start your design.");
      setFinishing("failed");
    }
  }, [answers, lang, into]);
  useEffect(() => {
    if (!q && !projectId && finishing === "idle") void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.id]);

  const back = () => {
    tick();
    const done = asked(answers).filter((x) => answers[x.id] !== undefined);
    const last = done.at(-1);
    if (!last) return;
    setAnswers((a) => {
      const { [last.id]: _, ...rest } = a;
      return rest;
    });
    setFinishing("idle");
    setProjectId(null);
  };

  const rewind = (id: string) => {
    tick();
    const order = asked(answers).map((x) => x.id);
    const from = order.indexOf(id);
    setAnswers((a) => Object.fromEntries(Object.entries(a).filter(([k]) => !order.includes(k) || order.indexOf(k) < from)));
    setFinishing("idle");
    setProjectId(null);
  };

  const pickLang = (id: LangId) => {
    tick();
    setLang(id);
    try {
      localStorage.setItem(LANG_KEY, id);
    } catch {}
  };

  const level = useMicLevel(talking && listen.listening);
  const stage = projectId ? 5 : q ? q.stage : 4;
  const voiceState: VoiceState = listen.listening ? "listening" : finishing === "working" ? "thinking" : voice.speaking ? "speaking" : "idle";
  const history = useMemo(() => asked(answers).filter((x) => answers[x.id] !== undefined), [answers]);

  const total = asked(answers).length;
  const number = Math.min(history.length + 1, total);
  const typing = q && (q.kind === "text" || q.kind === "taste");

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* blueprint grid with a soft light behind the question */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "radial-gradient(ellipse at center, black 35%, transparent 80%)" }}
      />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[620px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--accent)_12%,transparent),transparent)]" />
      {into?.whose && (
        <p className="relative mx-auto mt-2 w-fit rounded-full border border-accent/40 bg-accent/5 px-4 py-1 font-mono text-xs uppercase tracking-widest text-accent">
          For {into.whose.split(" ")[0]}&apos;s design
        </p>
      )}

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8">
        {/* the strip: what this is, voice, language */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-ink-soft">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            {say("title")}
          </p>
          <div className="flex items-center gap-2">
            {!into && (
              <Link href="/start/plan" className="hidden rounded-full border border-accent/40 bg-paper-raised px-3 py-1.5 text-sm text-accent transition hover:border-accent sm:inline-block">
                {say("havePlan")} →
              </Link>
            )}
            <button type="button" onClick={voice.toggle} aria-pressed={voice.on} aria-label={voice.on ? "Voice on" : "Voice off"} className="rounded-full border border-line bg-paper-raised px-3 py-1.5 text-sm text-ink-soft transition hover:border-accent hover:text-ink">
              {voice.on ? "🔊" : "🔇"}
            </button>
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
        </div>
        <ol className="grid grid-cols-5 gap-2" aria-label={`Progress: ${stage} of ${STAGES.length}`}>
          {STAGES.map((s, i) => (
            <li key={s}>
              <div className="h-1 overflow-hidden rounded-full bg-line">
                <motion.div className="h-1 rounded-full bg-gradient-to-r from-btn to-accent" initial={false} animate={{ width: i < stage ? "100%" : i === stage ? "35%" : "0%" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
              </div>
              <p className={`mt-1.5 hidden text-[11px] uppercase tracking-wider sm:block ${i <= stage ? "text-ink" : "text-ink-soft"}`}>{s}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8">
          {/* the stage: one question at a time, in the middle of the page */}
          <section className="relative mx-auto flex min-h-[460px] w-full max-w-3xl flex-col items-center justify-center text-center" aria-live="polite">
            <AnimatePresence mode="wait">
              {q ? (
                <motion.div
                  key={q.id}
                  initial={still ? false : { opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={still ? undefined : { opacity: 0, y: -18, filter: "blur(6px)" }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-2xl"
                >
                  {q.lead && (
                    <div className="mx-auto mb-6 flex w-fit flex-col items-center">
                      <div className="drop-shadow-[0_0_24px_var(--accent)]">
                        <AnimatedMark size={64} growing={false} />
                      </div>
                      <motion.p initial={still ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-4 max-w-md text-lg text-ink-soft">
                        {q.lead[lang]}
                      </motion.p>
                    </div>
                  )}
                  <p className="mx-auto flex w-fit items-center gap-1 font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
                    <span className="text-ink-soft">&gt;</span>
                    <span>{`${String(number).padStart(2, "0")} / ${String(total).padStart(2, "0")} · ${STAGES[q.stage]}`}</span>
                    <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-accent motion-reduce:animate-none" />
                  </p>
                  <h1 className="mx-auto mt-4 max-w-xl font-serif text-3xl leading-tight sm:text-4xl">
                    <Decode text={q.ask[lang]} speed={12} />
                  </h1>

                  <div className="mt-8">
                    {(q.kind === "choice" || q.kind === "multi") && <Choices q={q} lang={lang} onAnswer={(v) => answer(q.id, v)} doneLabel={say("done")} />}
                    {q.kind === "size" && <SizeInput lang={lang} say={say} onAnswer={(v) => answer(q.id, v)} />}
                    {typing && (
                      <form
                        className="mx-auto flex max-w-lg items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          submit(draft);
                        }}
                      >
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => {
                            setDraft(e.currentTarget.value);
                            setNudge(false);
                          }}
                          placeholder={q.hint?.[lang] ?? say("type")}
                          aria-label="Your answer"
                          className="h-12 min-w-0 flex-1 rounded-full border border-line bg-paper-raised px-5 text-lg outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
                        />
                        {q.kind === "text" && (
                          <button type="submit" disabled={!draft.trim()} className="glow-btn h-12 shrink-0 px-5 disabled:opacity-40">
                            →
                          </button>
                        )}
                      </form>
                    )}
                    {q.kind === "taste" && (
                      <div className="mx-auto mt-4 max-w-lg">
                        <TasteLookup q={q} text={draft} say={say} onAnswer={(v) => answer(q.id, v)} />
                      </div>
                    )}
                    {q.optional && (
                      <button type="button" onClick={() => answer(q.id, "")} className="mt-4 rounded-full px-4 py-1.5 text-sm text-ink-soft transition hover:text-accent">
                        {say("skip")} →
                      </button>
                    )}
                    {nudge && <p className="mt-4 text-sm text-accent">{say("tapOne")}</p>}
                  </div>

                  <div className="mt-10 flex items-center justify-center gap-4">
                    {history.length > 0 && (
                      <button type="button" onClick={back} className="rounded-full px-3 py-1.5 text-sm text-ink-soft transition hover:text-ink">
                        ← {say("back")}
                      </button>
                    )}
                    {listen.supported && (
                      <motion.button
                        type="button"
                        onClick={() => {
                          tick();
                          voice.stop();
                          setTalking(true);
                          listen.start();
                        }}
                        whileTap={still ? undefined : { scale: 0.92 }}
                        aria-label="Answer by voice"
                        className="relative grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-accent to-btn text-btn-ink shadow-[0_8px_30px_-10px_var(--accent)]"
                      >
                        <span className="absolute inset-0 animate-ping rounded-full bg-accent/25 motion-reduce:hidden" />
                        <MicIcon />
                      </motion.button>
                    )}
                    {(q.kind === "choice" || q.kind === "multi") && <p className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft sm:block">{say("keys")}</p>}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="finish" initial={still ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
                  <div className="mx-auto w-fit drop-shadow-[0_0_30px_var(--accent)]">
                    <AnimatedMark size={96} growing={!projectId} />
                  </div>
                  <h1 className="mt-6 font-serif text-3xl sm:text-4xl">{projectId ? say("ready") : say("building")}</h1>
                  <div className="mx-auto mt-6 w-fit text-left text-sm">
                    <TypeLog lines={["Confirming what you love with Qloo", "Reading your taste into style words", "Saving your project", "Handing over to the designer"]} done={!!projectId} />
                  </div>
                  {finishing === "failed" && (
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
                      <span className="text-ink-soft">{failure}</span>
                      <button type="button" onClick={() => void finish()} className="rounded-full border border-accent px-4 py-1.5 text-accent transition hover:bg-accent hover:text-btn-ink">
                        {say("retry")}
                      </button>
                      <button type="button" onClick={back} className="rounded-full px-3 py-1.5 text-ink-soft hover:text-ink">
                        ← {say("back")}
                      </button>
                    </div>
                  )}
                  {projectId && (
                    <Link href={`/project/${projectId}`} onClick={() => transition()} className="glow-btn mt-8 px-8 py-3.5 text-lg">
                      {say("see")}
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* what they've said so far, as a trail; tap one to go back to it */}
            {history.length > 0 && !projectId && (
              <div className="mt-12 flex max-w-2xl flex-wrap justify-center gap-1.5">
                {history.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    title={h.ask[lang]}
                    onClick={() => rewind(h.id)}
                    className="rounded-full border border-line bg-paper-raised/70 px-3 py-1 text-xs text-ink-soft backdrop-blur transition hover:border-accent hover:text-ink"
                  >
                    {labelOf(h, answers[h.id], lang)}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence>
              {talking && q && (
                <div className="absolute inset-0 z-20">
                  <VoiceMode
                    state={voiceState}
                    level={level}
                    heard={listen.interim}
                    reply={askText}
                    onOrb={listen.listening ? listen.stop : () => { voice.stop(); listen.start(); }}
                    onClose={() => {
                      setTalking(false);
                      listen.stop();
                    }}
                  />
                </div>
              )}
            </AnimatePresence>
          </section>

          <aside className="mx-auto mt-10 max-w-md xl:fixed xl:bottom-6 xl:right-6 xl:z-30 xl:mt-0 xl:w-[290px]">
            <div className="rounded-2xl border border-line bg-paper-raised/85 p-5 shadow-[0_20px_60px_-30px_var(--accent)] backdrop-blur">
              <div className="flex items-center gap-2">
                <Mark size={22} />
                <h2 className="font-serif text-2xl">{say("tasteTitle")}</h2>
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
                <p className="mt-3 text-sm text-ink-soft">{say("tasteEmpty")}</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Answers to tap. One tap answers a single choice; several can be ticked, then Done.
function Choices({ q, lang, onAnswer, doneLabel }: { q: Question; lang: LangId; onAnswer: (v: string | string[]) => void; doneLabel: string }) {
  const still = useReducedMotion();
  const [picked, setPicked] = useState<string[]>([]);
  const multi = q.kind === "multi";
  const toggle = (value: string) => {
    tick();
    // "None" stands alone; anything else clears it.
    setPicked((p) => (p.includes(value) ? p.filter((x) => x !== value) : value === "none" ? ["none"] : [...p.filter((x) => x !== "none"), value]));
  };
  // Keys 1 to 9 pick a choice, and Enter finishes a multiple pick, unless they're typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const ch = q.choices![Number(e.key) - 1];
      if (ch) {
        if (multi) toggle(ch.value);
        else onAnswer(ch.value);
      } else if (e.key === "Enter" && multi && picked.length) onAnswer(picked);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {q.choices!.map((ch, i) => {
        const on = picked.includes(ch.value);
        return (
          <motion.button
            key={ch.value}
            type="button"
            aria-pressed={multi ? on : undefined}
            onClick={() => (multi ? toggle(ch.value) : onAnswer(ch.value))}
            initial={still ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 420, damping: 24 }}
            whileHover={still ? undefined : { y: -2 }}
            className={`rounded-full border px-5 py-2.5 text-base transition-colors ${on ? "border-accent bg-accent text-btn-ink shadow-[0_8px_24px_-10px_var(--accent)]" : "border-line bg-paper-raised hover:border-accent hover:text-accent hover:shadow-[0_8px_24px_-14px_var(--accent)]"}`}
          >
            <span className={`mr-2 font-mono text-[10px] ${on ? "opacity-80" : "text-ink-soft"}`}>{i + 1}</span>
            {multi && <span className="mr-1">{on ? "✓" : "+"}</span>}
            {ch.label[lang]}
          </motion.button>
        );
      })}
      {multi && (
        <button type="button" disabled={!picked.length} onClick={() => onAnswer(picked)} className="rounded-full bg-btn px-4 py-1.5 text-sm text-btn-ink transition hover:opacity-90 disabled:opacity-40">
          {doneLabel} →
        </button>
      )}
    </div>
  );
}

function SizeInput({ lang, say, onAnswer }: { lang: LangId; say: (k: keyof typeof SAY) => string; onAnswer: (v: Answer) => void }) {
  const [w, setW] = useState("");
  const [d, setD] = useState("");
  const [unit, setUnit] = useState<"ft" | "m">(lang === "en" ? "ft" : "ft");
  const ok = Number(w) > 0 && Number(d) > 0;
  const field = "w-24 rounded-xl border border-line bg-paper px-3 py-2 outline-none focus:border-accent";
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex flex-wrap items-end justify-center gap-2">
        <label className="text-xs text-ink-soft">
          {say("width")}
          <input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value.replace(/[^\d.]/g, ""))} className={`mt-1 block ${field}`} aria-label={say("width")} />
        </label>
        <span className="pb-2 text-ink-soft">×</span>
        <label className="text-xs text-ink-soft">
          {say("depth")}
          <input inputMode="decimal" value={d} onChange={(e) => setD(e.target.value.replace(/[^\d.]/g, ""))} className={`mt-1 block ${field}`} aria-label={say("depth")} />
        </label>
        <div className="flex rounded-full border border-line p-0.5" role="radiogroup" aria-label="Unit">
          {(["ft", "m"] as const).map((u) => (
            <button key={u} type="button" role="radio" aria-checked={unit === u} onClick={() => setUnit(u)} className={`rounded-full px-3 py-1 text-sm ${unit === u ? "bg-btn text-btn-ink" : "text-ink-soft"}`}>
              {u}
            </button>
          ))}
        </div>
        <button type="button" disabled={!ok} onClick={() => onAnswer({ width: Number(w), depth: Number(d), unit })} className="rounded-full bg-btn px-4 py-2 text-sm text-btn-ink transition hover:opacity-90 disabled:opacity-40">
          {say("done")} →
        </button>
      </div>
      <button type="button" onClick={() => onAnswer({ typical: true })} className="rounded-full border border-line bg-paper px-4 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent">
        {say("notSure")}
      </button>
    </div>
  );
}

// A taste answer: what they type is matched in Qloo as they type, and they confirm the match with a tap.
function TasteLookup({ q, text, say, onAnswer }: { q: Question; text: string; say: (k: keyof typeof SAY) => string; onAnswer: (v: TastePick) => void }) {
  const [look, setLook] = useState<Look | null>(null);
  const [chosen, setChosen] = useState<Candidate | null>(null);
  const query = text.trim();
  useEffect(() => {
    setLook(null);
    setChosen(null);
    if (query.length < 2) return;
    let live = true;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/taste?slot=${q.slot}&q=${encodeURIComponent(query)}`).catch(() => null);
      const body: Look = res ? await res.json().catch(() => ({ error: "Couldn't look that up." })) : { error: "Couldn't look that up. Check your connection." };
      if (!live) return;
      setLook(body);
      if ("matches" in body && body.matches[0]) setChosen(body.matches[0]);
    }, 450);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query, q.slot]);

  const describe = (c: Candidate) => [c.kind, c.detail].filter(Boolean).join(" · ");
  if (query.length < 2) return null;
  return (
    <div aria-live="polite" className="text-sm">
      {!look && <p className="animate-pulse font-mono text-xs text-ink-soft">› {say("looking")}</p>}
      {look && "error" in look && <p className="text-accent">{look.error}</p>}
      {look && "matches" in look && !look.matches.length && <p className="text-accent">{look.hint}</p>}
      {chosen && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-ink-soft">{say("found")}:</span>
          <strong>{chosen.name}</strong>
          <span className="text-ink-soft">({describe(chosen)})</span>
          <button type="button" onClick={() => onAnswer({ slot: q.slot!, id: chosen.entityId, name: chosen.name })} className="rounded-full bg-btn px-4 py-1.5 text-btn-ink transition hover:opacity-90">
            {say("thatsIt")} →
          </button>
        </div>
      )}
      {look && "matches" in look && look.matches.length > 1 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-ink-soft">{say("notIt")}</span>
          {look.matches
            .filter((m) => m.entityId !== chosen?.entityId)
            .map((m) => (
              <button key={m.entityId} type="button" onClick={() => setChosen(m)} className="rounded-full border border-line px-3 py-1 transition hover:border-accent">
                {m.name} <span className="text-ink-soft">({describe(m)})</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// Arcon's mark, on its own: no circle or box behind it. Its seeds grow while Arcon works.
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
