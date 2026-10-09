"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { AnimatedMark } from "@/components/AnimatedMark";
import { Decode, TypeLog } from "@/components/fx/Decode";
import { processingLog } from "@/lib/design/log";
import { chime, preload, startProcessing, whoosh } from "@/components/fx/sfx";
import { PlanSvg } from "@/components/plan/PlanSvg";
import type { Brief } from "@/lib/design/brief";
import type { Layout } from "@/lib/layout/schema";
import type { Project } from "@/lib/project/store";
import { canLeave, isStep, nextStep, STEPS, type StepId } from "./steps";
import { WalkthroughStep } from "./WalkthroughStep";

type View = Omit<Project, "owner_id" | "guest_id"> & { brief: Brief | null; options?: Layout[] | null };

const WORK = ["read", "taste", "brief", "program", "plans"]; // progress ticks while the design request runs

export function ProjectView({ id }: { id: string }) {
  const [p, setP] = useState<View | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [work, setWork] = useState(0);
  const [step, setStepState] = useState<StepId>("brief");
  const [choosing, setChoosing] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const key = `arcon-step-${id}`;

  const setStep = (s: StepId) => {
    whoosh();
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
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex-1"
        >
          {step === "brief" && <BriefStep p={p} brief={p.brief} />}
          {step === "plans" && <PlansStep p={p} options={p.options} choosing={choosing} choose={choose} />}
          {step === "walkthrough" && <WalkthroughStep layout={p.options[p.chosen_option ?? 0]} brief={p.brief} taste={p.taste} title={p.title} />}
          {step === "budget" && <Coming title="What it will cost" text="An estimate by room and by trade, with a low and a high range for your city." />}
          {step === "drawings" && <Coming title="Your drawings" text="Plans you can download and share with your architect or builder." />}
          {step === "workspace" && <Coming title="Make it yours" text="Ask for any change and watch the plan, 3D model and budget update." />}
        </motion.div>
      </AnimatePresence>
      {next && (
        <div className="sticky bottom-0 border-t border-line bg-paper/90 px-4 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <p className="text-sm text-ink-soft">{step === "plans" && p.chosen_option === null ? "Choose a plan to continue" : " "}</p>
            <button
              onClick={() => setStep(next)}
              disabled={!canLeave(step, p)}
              className="rounded-full bg-btn px-8 py-3 text-lg text-btn-ink transition disabled:opacity-30"
            >
              Next: {STEPS.find((s) => s.id === next)?.label}
            </button>
          </div>
        </div>
      )}
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
  const stagger = (delay: number) => ({ initial: still ? false : "hidden", animate: "show", variants: rise, transition: { duration: 0.6, delay } }) as const;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <motion.p {...stagger(0)} className="text-sm uppercase tracking-widest text-ink-soft">
        {p.title} · your style
      </motion.p>
      <h1 className="mt-3 font-serif text-6xl sm:text-7xl">
        <Decode text={b.name} delay={0.15} speed={34} />
      </h1>
      <motion.p {...stagger(0.4)} className="mt-5 max-w-2xl text-xl leading-relaxed text-ink-soft">
        {b.summary}
      </motion.p>

      <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {b.palette.map((c, i) => (
          <motion.li key={c.hex + c.name} {...stagger(0.8 + i * 0.12)} className="overflow-hidden rounded-xl border border-line bg-paper-raised">
            <motion.div className="h-28" style={{ background: c.hex }} initial={still ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.8 + i * 0.12, duration: 0.5 }} />
            <div className="p-3 text-sm">
              <p className="font-medium">{c.name}</p>
              <p className="text-ink-soft">{c.role}</p>
              {c.from.length > 0 && <p className="mt-1 text-xs text-ink-soft">From {c.from.join(", ")}</p>}
            </div>
          </motion.li>
        ))}
      </ul>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <motion.section {...stagger(1.6)} className="rounded-2xl border border-line bg-paper-raised p-5">
          <h2 className="font-serif text-2xl">Materials</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {b.materials.map((m) => (
              <li key={m.name}>
                <span className="font-medium">{m.name}</span> <span className="text-ink-soft">· {m.where}</span>
                {m.from.length > 0 && <p className="text-xs text-ink-soft">From {m.from.join(", ")}</p>}
              </li>
            ))}
          </ul>
        </motion.section>
        <motion.section {...stagger(1.8)} className="rounded-2xl border border-line bg-paper-raised p-5">
          <h2 className="font-serif text-2xl">Light</h2>
          <p className="mt-3 text-sm">{b.lighting.mood}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
            {b.lighting.fixtures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </motion.section>
        <motion.section {...stagger(2.0)} className="rounded-2xl border border-line bg-paper-raised p-5">
          <h2 className="font-serif text-2xl">Plants in every room</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {b.plants.map((pl) => (
              <li key={pl.name}>
                <span className="font-medium text-leaf">{pl.name}</span> <span className="text-ink-soft">· {pl.where}</span>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>

      {p.taste && p.taste.brands.length > 0 && (
        <motion.section {...stagger(2.3)} className="mt-10">
          <h2 className="font-serif text-2xl">Brands that match your taste</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {p.taste.brands.slice(0, 8).map((br) => (
              <li key={br.id} className="rounded-full border border-line bg-paper-raised px-4 py-1.5 text-sm">
                {br.name}
              </li>
            ))}
          </ul>
        </motion.section>
      )}
    </main>
  );
}

function PlansStep({ p, options, choosing, choose }: { p: View; options: Layout[]; choosing: number | null; choose: (i: number) => void }) {
  const units = p.site.units ?? "imperial";
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="font-serif text-5xl">
        <Decode text="Three ways to lay it out" />
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">The same rooms, arranged differently. Pick the one that fits how you live; you can change anything later.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {options.map((layout, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`rounded-2xl border bg-paper-raised p-4 ${p.chosen_option === i ? "border-accent ring-2 ring-accent/30" : "border-line"}`}
          >
            <h2 className="font-serif text-2xl">Option {i + 1}</h2>
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
