"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { STEPS, type StepId } from "./steps";
import { TeamPanel } from "./TeamPanel";
import { ThreadView, type Room } from "./ThreadView";
import type { Layout } from "@/lib/layout/schema";
import { ROLE_NAME, can, type ProjectRole } from "@/lib/project/access";
import { nextLine, STAGES, stageOf, tabsFor, unlockPrice, type Tab } from "@/lib/project/stage";
import { ok, tick } from "@/components/fx/sfx";

type Home = {
  id: string;
  title: string | null;
  space_type: string | null;
  status: Parameters<typeof stageOf>[0]["status"];
  chosen_option: number | null;
  unlocked?: boolean;
  unread?: number;
  options?: Layout[] | null;
  site: { location?: string; units?: "imperial" | "metric" };
};

// A project once its guided steps are done: whose it is, where it is in its life, and tabs for this person.
// The tabs show the same step screens as the guided tour, so every button inside them keeps working.
export function ProjectHome({
  p,
  role,
  whose,
  step,
  pane,
  setStep,
  showPane,
  discuss,
  onStatus,
  body,
  onUnlocked,
  onTour,
}: {
  p: Home;
  role: ProjectRole;
  whose: string | null;
  step: StepId;
  pane: "overview" | "thread" | null;
  setStep: (s: StepId) => void;
  showPane: (pane: "overview" | "thread") => void;
  discuss: Room | null;
  onStatus: (status: string) => void;
  body: (s: StepId) => ReactNode;
  onUnlocked: () => void;
  onTour: () => void;
}) {
  const unlocked = !!p.unlocked;
  const tabs = tabsFor(role, unlocked);
  const active: Tab = pane ? (tabs.find((t) => t.id === pane) ?? tabs[0]) : (tabs.find((t) => t.steps.includes(step)) ?? tabs[0]);
  const stage = stageOf(p);
  const label = (s: string) => (s === "brief" ? (whose ? `${whose}'s style` : "Style") : s === "walkthrough" ? "3D" : (STEPS.find((x) => x.id === s)?.label ?? s));
  const [team, setTeam] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto w-full max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-ink-soft">
              {whose ? `${whose}'s design` : "Your design"}
              {role !== "owner" && <span className="ml-2 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">You&apos;re the {ROLE_NAME[role].toLowerCase()}</span>}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl">{p.title ?? "Your project"}</h1>
          </div>
          {!unlocked && <span className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft">Preview</span>}
        </div>
        {/* Where the project is in its life */}
        <ol className="mt-5 grid grid-cols-6 gap-1.5" aria-label="Project progress">
          {STAGES.map((s, i) => (
            <li key={s.id} aria-current={i === stage ? "step" : undefined}>
              <span className={`block h-1.5 rounded-full ${i < stage ? "bg-leaf" : i === stage ? "bg-accent" : "bg-line"}`} />
              <span className={`mt-1.5 block truncate text-[11px] sm:text-xs ${i === stage ? "font-medium text-ink" : "text-ink-soft"}`}>{s.label}</span>
            </li>
          ))}
        </ol>
        <nav aria-label="Project" className="mt-6 flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => (t.id === "overview" || t.id === "thread" ? (tick(), showPane(t.id)) : setStep(t.steps[0] as StepId))}
              aria-current={active.id === t.id ? "page" : undefined}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition ${active.id === t.id ? "border-accent text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}
            >
              {t.label}
              {t.locked && <span aria-label="locked"> 🔒</span>}
              {t.id === "thread" && !!p.unread && pane !== "thread" && <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[11px] text-white">{p.unread}</span>}
            </button>
          ))}
        </nav>
        {!active.locked && active.steps.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {active.steps.map((s) => (
              <button
                key={s}
                onClick={() => setStep(s as StepId)}
                aria-pressed={step === s}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${step === s ? "bg-btn text-btn-ink" : "border border-line text-ink-soft hover:text-ink"}`}
              >
                {label(s)}
                {s === "workspace" && !unlocked && " 🔒"}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* No exit animation: the 3D's room labels are separate React roots and break if kept alive while leaving. */}
      <motion.div key={pane ?? step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex-1 pt-4">
          {active.id === "thread" ? (
            <ThreadView
              key={discuss?.id ?? "thread"}
              projectId={p.id}
              layout={p.chosen_option !== null ? (p.options?.[p.chosen_option] ?? null) : null}
              units={p.site.units ?? (p.site.location && /\b(US|USA|TX|CA|NY|FL)\b/.test(p.site.location) ? "imperial" : "metric")}
              room={discuss}
              onStatus={onStatus}
            />
          ) : active.id === "overview" ? (
            <Overview p={p} role={role} unlocked={unlocked} go={(s) => setStep(s)} onThread={() => showPane("thread")} onTeam={() => setTeam(true)} onUnlocked={onUnlocked} onTour={onTour} />
          ) : active.locked || (step === "workspace" && !unlocked) ? (
            <div className="mx-auto max-w-6xl px-4 py-8">
              <Unlock p={p} role={role} onUnlocked={onUnlocked} />
            </div>
          ) : (
            body(step)
          )}
      </motion.div>
      {typeof document !== "undefined" && createPortal(<AnimatePresence>{team && <TeamPanel id={p.id} onClose={() => setTeam(false)} />}</AnimatePresence>, document.body)}
    </div>
  );
}

function Overview({ p, role, unlocked, go, onThread, onTeam, onUnlocked, onTour }: { p: Home; role: ProjectRole; unlocked: boolean; go: (s: StepId) => void; onThread: () => void; onTeam: () => void; onUnlocked: () => void; onTour: () => void }) {
  const plan = p.chosen_option !== null ? p.options?.[p.chosen_option]?.concept?.name : null;
  const cards: { title: string; text: string; to?: StepId; action?: () => void; locked?: boolean }[] = [
    { title: "Design", text: plan ? `${plan}: style, plans and 3D` : "Style, plans and 3D", to: "brief" },
    ...(role !== "viewer" ? [{ title: "Budget & shopping", text: "Cost by room and the shopping list", to: "budget" as StepId, locked: !unlocked }] : []),
    { title: "Thread", text: p.unread ? `${p.unread} new message${p.unread === 1 ? "" : "s"}` : "Talk with everyone on the project; reviews happen here", action: onThread },
    { title: "Team", text: "Who's on this project, and invite people", action: onTeam },
    ...(role !== "viewer" ? [{ title: "Files", text: "PDF, CAD drawing, sketches, video", to: "drawings" as StepId, locked: !unlocked }] : []),
  ];
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16">
      <p className="rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4">
        <span className="text-xs uppercase tracking-widest text-accent">Next</span>
        <span className="mt-1 block text-lg">{nextLine(p, role)}</span>
      </p>
      {!unlocked && (
        <div className="mt-4">
          <Unlock p={p} role={role} onUnlocked={onUnlocked} />
        </div>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <button
            key={c.title}
            onClick={() => (c.action ? c.action() : c.to && go(c.to))}
            className="group rounded-2xl border border-line bg-paper-raised p-5 text-left transition hover:-translate-y-0.5 hover:border-accent"
          >
            <p className="font-serif text-2xl group-hover:text-accent">
              {c.title}
              {c.locked && <span className="ml-2 text-sm">🔒</span>}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{c.text}</p>
          </button>
        ))}
      </div>
      {can(role, "edit") && (
        <button onClick={onTour} className="mt-8 text-sm text-ink-soft hover:text-accent">
          ↻ Take the guided tour again
        </button>
      )}
    </main>
  );
}

// The unlock card. ponytail: unlocking is free until PayPal checkout lands (R5); the button says so plainly.
function Unlock({ p, role, onUnlocked }: { p: Home; role: ProjectRole; onUnlocked: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const price = unlockPrice(p.space_type);
  async function unlock() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/projects/${p.id}/unlock`, { method: "POST" });
    setBusy(false);
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't unlock. Please try again.");
    ok();
    onUnlocked();
  }
  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-5">
      <p className="font-serif text-2xl">Unlock this project</p>
      <p className="mt-1 text-sm text-ink-soft">
        You&apos;re seeing the preview: your style, the three plans and the 3D from outside. Unlocking opens the walk inside, the budget, the shopping list, Make
        changes, every download and inviting your architect or builder. One payment of ${price} for this project.
      </p>
      {role === "owner" ? (
        <button onClick={unlock} disabled={busy} className="glow-btn mt-4 rounded-full px-6 py-2.5 text-sm disabled:opacity-60">
          {busy ? "Unlocking…" : `Unlock for $${price} · free during the preview`}
        </button>
      ) : (
        <p className="mt-4 text-sm">Ask the project&apos;s owner to unlock it.</p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
