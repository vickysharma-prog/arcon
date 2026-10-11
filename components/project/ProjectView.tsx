"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatedMark } from "@/components/AnimatedMark";
import { Decode, TypeLog } from "@/components/fx/Decode";
import { processingLog } from "@/lib/design/log";
import { chime, preload, startProcessing, transition as stepSound } from "@/components/fx/sfx";
import { PlanSvg } from "@/components/plan/PlanSvg";
import type { Brief } from "@/lib/design/brief";
import { compare, sayClaim } from "@/lib/design/compare";
import type { Layout } from "@/lib/layout/schema";
import type { Project } from "@/lib/project/store";
import { canLeave, isStep, nextStep, STEPS, type StepId } from "./steps";
import { WalkthroughStep } from "./WalkthroughStep";
import { CheckPlan } from "@/components/import/CheckPlan";
import { importedOf } from "@/lib/plan-import/edits";
import { creditOf, sayCredit, styleWords, tasteTrail } from "@/lib/design/trail";
import { TasteTrail } from "./TasteTrail";
import { Moodboard } from "./Moodboard";
import { BudgetStep } from "./BudgetStep";
import { ShoppingStep } from "./ShoppingStep";
import { HudCard, Reveal } from "@/components/fx/Motion";
import { tick } from "@/components/fx/sfx";
import { choicesOf, type Ticked } from "@/lib/green/improve";

const greenTicked = (interview: Record<string, unknown> | null | undefined): Ticked => (Array.isArray(interview?.green) ? (interview.green as Ticked) : []);

type View = Omit<Project, "owner_id" | "guest_id"> & { brief: Brief | null; options?: Layout[] | null };

const WORK = ["read", "taste", "brief", "program", "plans"]; // progress ticks while the design request runs

export function ProjectView({ id }: { id: string }) {
  const [p, setP] = useState<View | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [work, setWork] = useState(0);
  const [step, setStepState] = useState<StepId>("brief");
  const still = useReducedMotion();
  // One object per saved list, so the 3D only re-furnishes when the plants actually change.
  const green = p?.interview?.green;
  const extraPlants = useMemo(() => choicesOf(greenTicked({ green })).extra, [green]);
  const [choosing, setChoosing] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const key = `arcon-step-${id}`;

  const setStep = (s: StepId) => {
    stepSound();
    setStepState(s);
    try {
      sessionStorage.setItem(key, s);
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    try {
      // A link can open a step directly (?step=walkthrough); otherwise resume where this tab left off.
      const asked = new URLSearchParams(location.search).get("step");
      const saved = isStep(asked) ? asked : sessionStorage.getItem(key);
      if (isStep(saved)) setStepState(saved);
    } catch {}
  }, [key]);

  const design = useCallback(async () => {
    setError(null);
    const started = performance.now();
    const timer = setInterval(() => setWork((s) => Math.min(s + 1, WORK.length - 1)), 4000);
    try {
      const res = await fetch(`/api/projects/${id}/design`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Design failed");
      setWork(WORK.length);
      // Let the engine log finish typing before the reveal, even when the design comes back fast.
      await new Promise((r) => setTimeout(r, Math.max(900, 6500 - (performance.now() - started))));
      chime();
      setP(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Design failed");
    } finally {
      clearInterval(timer);
    }
  }, [id]);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("We couldn't find this project in this browser.");
        const body: View = await res.json();
        setP(body);
      })
      .catch((e) => setError(e.message));
  }, [id, design]);

  const choose = async (option: number) => {
    setChoosing(option);
    const res = await fetch(`/api/projects/${id}/choose`, { method: "POST", body: JSON.stringify({ option }) });
    if (res.ok) setP(await res.json());
    setChoosing(null);
  };

  if (error)
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-lg">{error}</p>
        {p && (
          <button onClick={() => void design()} className="mt-6 rounded-full bg-btn px-6 py-3 text-btn-ink">
            Try again
          </button>
        )}
      </main>
    );

  // A plan the user uploaded is checked first: rooms, size and a few loves for the styling.
  const imported = p ? importedOf(p.interview) : null;
  if (p && imported && !imported.confirmed)
    return <CheckPlan id={id} imported={imported} units={p.site.units ?? "imperial"} onDone={(next) => setP(next as View)} />;

  // A design that hasn't been made yet waits for one click: the reveal starts on the user's cue,
  // and that click is what lets the browser play its sounds.
  if (p && (!p.brief || !p.options?.length) && !started)
    return (
      <Ready
        title={p.title}
        onStart={() => {
          preload();
          setStarted(true);
          void design();
        }}
      />
    );
  if (!p || !p.brief || !p.options?.length) return <Processing p={p} done={work >= WORK.length} />;

  const next = nextStep(step);
  return (
    <div className="flex flex-1 flex-col">
      <Progress step={step} onJump={(s) => STEPS.findIndex((x) => x.id === s) <= STEPS.findIndex((x) => x.id === step) && setStep(s)} />
      {/* Next sits top right on every step (the walkthrough puts it in its own top row), and stays in reach while scrolling. */}
      {next && step !== "walkthrough" && (
        <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-4 px-4 py-2">
            {step === "plans" && p.chosen_option === null && <p className="text-sm text-ink-soft">Choose a plan to continue</p>}
            <button
              onClick={() => setStep(next)}
              disabled={!canLeave(step, p)}
              className="rounded-full bg-btn px-6 py-2.5 text-btn-ink transition hover:opacity-90 disabled:opacity-30"
            >
              Next: {STEPS.find((s) => s.id === next)?.label}
            </button>
          </div>
        </div>
      )}
      {/* A scan line sweeps down the screen as each step arrives. */}
      <AnimatePresence>
        {!still && (
          <motion.div
            key={`scan-${step}`}
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 z-40 h-24 bg-gradient-to-b from-transparent via-accent/20 to-transparent"
            initial={{ y: "-10vh", opacity: 1 }}
            animate={{ y: "110vh", opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={still ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={still ? undefined : { opacity: 0, y: -12, filter: "blur(6px)" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1"
        >
          {step === "brief" && <BriefStep p={p} brief={p.brief} />}
          {step === "plans" && <PlansStep p={p} options={p.options} choosing={choosing} choose={choose} />}
          {step === "walkthrough" && (
            <WalkthroughStep
              layout={p.options[p.chosen_option ?? 0]}
              extraPlants={extraPlants}
              brief={p.brief}
              taste={p.taste}
              title={p.title}
              option={p.chosen_option ?? 0}
              planName={p.options[p.chosen_option ?? 0]?.concept?.name}
              changePlan={() => setStep("plans")}
              next={next ? { label: `Next: ${STEPS.find((s) => s.id === next)?.label}`, go: () => setStep(next) } : undefined}
            />
          )}
          {step === "budget" && p.options?.[p.chosen_option ?? 0] && (
            <BudgetStep
              id={p.id}
              layout={p.options[p.chosen_option ?? 0]}
              location={p.site.location}
              interview={p.interview}
              brief={p.brief}
              profile={p.taste}
              lot={p.site.width && p.site.depth ? { width: p.site.width, depth: p.site.depth } : null}
              ticked={greenTicked(p.interview)}
              onTicked={(t) => setP((old) => (old ? { ...old, interview: { ...old.interview, green: t } } : old))}
            />
          )}
          {step === "shop" && <ShoppingStep id={p.id} location={p.site.location} />}
          {step === "drawings" && <Coming title="Your drawings" text="Plans you can download and share with your architect or builder." />}
          {step === "workspace" && <Coming title="Make it yours" text="Ask for any change and watch the plan, 3D model and budget update." />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Ready({ title, onStart }: { title?: string | null; onStart: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <AnimatedMark size={110} growing={false} />
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-ink-soft">Interview complete</p>
      <h1 className="mt-3 font-serif text-5xl sm:text-6xl">
        <Decode text={`Ready to see ${title ?? "your space"}?`} />
      </h1>
      <p className="mt-4 max-w-md text-lg text-ink-soft">Arcon turns everything you told it into a style, three plans and a walk through your space.</p>
      <button onClick={onStart} className="mt-10 rounded-full bg-btn px-9 py-4 text-lg text-btn-ink transition hover:opacity-90">
        Design my space
      </button>
    </main>
  );
}

function Processing({ p, done }: { p: View | null; done: boolean }) {
  // The computer-processing sound plays for as long as this screen is up.
  useEffect(() => startProcessing(), []);
  return (
    <main className="arcon-scan flex flex-1 flex-col items-center justify-center px-4 py-12">
      <AnimatedMark size={130} />
      <h1 className="mt-6 text-center font-serif text-4xl sm:text-5xl">
        <Decode text={`Designing ${p?.title ?? "your space"}`} />
      </h1>
      <div className="mt-8 w-full max-w-2xl rounded-2xl border border-line bg-paper-raised/80 p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-soft">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> arcon engine
        </div>
        {p ? <TypeLog lines={processingLog(p)} done={done} /> : <TypeLog lines={["> loading project"]} done={false} />}
      </div>
    </main>
  );
}

function Progress({ step, onJump }: { step: StepId; onJump: (s: StepId) => void }) {
  const at = STEPS.findIndex((s) => s.id === step);
  return (
    <nav aria-label="Progress" className="mx-auto w-full max-w-6xl px-4 pb-2">
      <ol className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex-1">
            <button onClick={() => onJump(s.id)} disabled={i > at} className="w-full text-left disabled:cursor-default" aria-current={i === at ? "step" : undefined}>
              <span className={`block h-1 rounded-full ${i <= at ? "bg-accent" : "bg-line"}`} />
              <span className={`mt-1.5 hidden text-xs sm:block ${i === at ? "text-ink" : "text-ink-soft"}`}>{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

const rise = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

function BriefStep({ p, brief: b }: { p: View; brief: Brief }) {
  const still = useReducedMotion();
  const credit = (names: string[]) => names.map((n) => sayCredit(creditOf(p, n))).join("; ");
  const words = styleWords(p);
  const chosen = p.chosen_option !== null ? p.options?.[p.chosen_option] : null;
  const stagger = (delay: number) => ({ initial: still ? false : "hidden", animate: "show", variants: rise, transition: { duration: 0.6, delay } }) as const;
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (hex: string) => {
    tick();
    void navigator.clipboard?.writeText(hex).catch(() => {});
    setCopied(hex);
    setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1400);
  };
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-2">
      <motion.p {...stagger(0)} className="text-sm uppercase tracking-widest text-ink-soft">
        {p.title} · your style
      </motion.p>
      <h1 className="mt-3 font-serif text-6xl sm:text-7xl">
        <Decode text={b.name} delay={0.15} speed={34} />
      </h1>
      <motion.p {...stagger(0.4)} className="mt-5 max-w-2xl text-xl leading-relaxed text-ink-soft">
        {b.summary}
      </motion.p>
      {words.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="The words your style is made of">
          {words.map((w, i) => (
            <motion.li
              key={w.word}
              initial={still ? false : { opacity: 0, scale: 0.6, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.6 + i * 0.08 }}
              whileHover={still ? undefined : { y: -2 }}
              className="rounded-full border border-line bg-paper-raised px-3 py-1 text-sm transition-colors hover:border-accent"
            >
              {w.word} <span className="text-ink-soft">· {w.from[0] ? (w.from[0].loved ? w.from[0].name : sayCredit(w.from[0])) : ""}</span>
            </motion.li>
          ))}
        </ul>
      )}

      <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {b.palette.map((c, i) => (
          <motion.li key={c.hex + c.name} {...stagger(0.8 + i * 0.12)} whileHover={still ? undefined : { y: -6 }} className="overflow-hidden rounded-xl border border-line bg-paper-raised transition-shadow hover:shadow-[0_14px_40px_-20px_var(--accent)]">
            <button type="button" onClick={() => copy(c.hex)} className="group relative block h-28 w-full" aria-label={`Copy ${c.name}, ${c.hex}`}>
              <motion.span className="absolute inset-0 origin-bottom" style={{ background: c.hex }} initial={still ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.8 + i * 0.12, duration: 0.5 }} />
              <span className="absolute bottom-2 left-2 rounded bg-black/45 px-1.5 py-0.5 font-mono text-[11px] uppercase text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {copied === c.hex ? "Copied" : c.hex}
              </span>
            </button>
            <div className="p-3 text-sm">
              <p className="font-medium">{c.name}</p>
              <p className="text-ink-soft">{c.role}</p>
              {c.from.length > 0 && <p className="mt-1 text-xs text-ink-soft">From {credit(c.from)}</p>}
            </div>
          </motion.li>
        ))}
      </ul>

      <Reveal>
        <Moodboard id={p.id} />
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <HudCard className="p-5">
          <h2 className="font-serif text-2xl">Materials</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {b.materials.map((m) => (
              <li key={m.name}>
                <span className="font-medium">{m.name}</span> <span className="text-ink-soft">· {m.where}</span>
                {m.from.length > 0 && <p className="text-xs text-ink-soft">From {credit(m.from)}</p>}
              </li>
            ))}
          </ul>
        </HudCard>
        <HudCard className="p-5" delay={0.08}>
          <h2 className="font-serif text-2xl">Light</h2>
          <p className="mt-3 text-sm">{b.lighting.mood}</p>
          {b.lighting.from.length > 0 && <p className="mt-1 text-xs text-ink-soft">From {credit(b.lighting.from)}</p>}
          <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
            {b.lighting.fixtures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </HudCard>
        <HudCard className="p-5" delay={0.16}>
          <h2 className="font-serif text-2xl">Plants in every room</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {b.plants.map((pl) => (
              <li key={pl.name}>
                <span className="font-medium text-leaf">{pl.name}</span> <span className="text-ink-soft">· {pl.where}</span>
              </li>
            ))}
          </ul>
        </HudCard>
      </div>

      {p.taste && p.taste.brands.length > 0 && (
        <Reveal className="mt-10">
          <h2 className="font-serif text-2xl">Brands that match your taste</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {p.taste.brands.slice(0, 8).map((br) => (
              <li key={br.id} className="rounded-full border border-line bg-paper-raised px-4 py-1.5 text-sm">
                {br.name}
                {creditOf(p, br.name).via.length > 0 && <span className="text-ink-soft"> · matched to {creditOf(p, br.name).via.slice(0, 2).join(" and ")}</span>}
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      <Reveal>
        <TasteTrail trail={tasteTrail(p, b, chosen)} />
      </Reveal>
    </main>
  );
}

function PlansStep({ p, options, choosing, choose }: { p: View; options: Layout[]; choosing: number | null; choose: (i: number) => void }) {
  const units = p.site.units ?? "imperial";
  const personal = options.some((o) => o.concept);
  // What each plan does best and gives up, measured against the others.
  const trades = compare(options);
  const home = ["house", "apartment", "studio"].includes(p.space_type ?? "house");
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-2">
      <h1 className="font-serif text-5xl">
        <Decode text={personal ? "Plans picked for how you live" : "Three ways to lay it out"} />
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        {personal
          ? "Different layout ideas for the same rooms, best fit first, each with the reasons from what you told us. Pick one; you can change anything later."
          : "The same rooms, arranged differently. Pick the one that fits how you live; you can change anything later."}
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {options.map((layout, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`rounded-2xl border bg-paper-raised p-4 ${p.chosen_option === i ? "border-accent ring-2 ring-accent/30" : "border-line"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-widest text-ink-soft">Option {i + 1}</p>
              {layout.concept?.id === "own" ? (
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">Your upload</span>
              ) : (
                i === options.findIndex((o) => o.concept?.id !== "own") &&
                layout.concept &&
                layout.concept.why.length > 0 && <span className="rounded-full bg-leaf/15 px-2.5 py-0.5 text-xs font-medium text-leaf">Best fit for you</span>
              )}
            </div>
            <h2 className="mt-1 font-serif text-2xl">{layout.concept?.name ?? `Option ${i + 1}`}</h2>
            {layout.concept?.summary && <p className="mt-1 text-sm text-ink-soft">{layout.concept.summary}</p>}
            {!!layout.concept?.why.length && (
              <ul className="mt-3 space-y-1.5 rounded-xl bg-paper p-3">
                {layout.concept.why.map((w) => (
                  <li key={w} className="flex gap-2 text-sm">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
            {(trades[i].gains.length > 0 || trades[i].gives.length > 0) && (
              <div className="mt-3">
                <p className="text-xs uppercase tracking-widest text-ink-soft">Compared with the others</p>
                <ul className="mt-1.5 space-y-1 text-sm">
                  {trades[i].gains.map((c) => (
                    <li key={c.measure} className="flex gap-2">
                      <span className="w-4 shrink-0 text-center font-medium text-leaf">+</span>
                      <span>{sayClaim(c, units, home)}</span>
                    </li>
                  ))}
                  {trades[i].gives.map((c) => (
                    <li key={c.measure} className="flex gap-2 text-ink-soft">
                      <span className="w-4 shrink-0 text-center font-medium">−</span>
                      <span>{sayClaim(c, units, home)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {layout.floors.map((f) => (
              <div key={f.level} className="mt-3">
                {layout.floors.length > 1 && <p className="text-xs uppercase tracking-widest text-ink-soft">{f.level === 0 ? "Ground floor" : "Upstairs"}</p>}
                <PlanSvg layout={layout} level={f.level} units={units} className="w-full" />
              </div>
            ))}
            <button
              onClick={() => choose(i)}
              disabled={choosing !== null}
              className={`mt-4 w-full rounded-full px-4 py-2.5 ${p.chosen_option === i ? "bg-accent text-paper" : "border border-ink text-ink"} disabled:opacity-50`}
            >
              {p.chosen_option === i ? "Chosen" : choosing === i ? "Saving…" : "Choose this plan"}
            </button>
          </motion.article>
        ))}
      </div>
    </main>
  );
}

function Coming({ title, text }: { title: string; text: string }) {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <AnimatedMark size={90} growing={false} />
      <h1 className="mt-8 font-serif text-5xl">{title}</h1>
      <p className="mt-4 text-lg text-ink-soft">{text}</p>
      <p className="mt-6 rounded-full border border-line px-4 py-1.5 text-sm text-ink-soft">Being built now</p>
    </main>
  );
}
