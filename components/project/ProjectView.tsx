"use client";

import { useCallback, useEffect, useState } from "react";
import { PlanSvg } from "@/components/plan/PlanSvg";
import type { Brief } from "@/lib/design/brief";
import type { Layout } from "@/lib/layout/schema";
import type { Project } from "@/lib/project/store";

type View = Omit<Project, "owner_id" | "guest_id"> & { brief: Brief | null; options?: Layout[] | null };

const STEPS = ["Reading your interview", "Writing your design brief", "Planning the rooms", "Drawing three plans"];

export function ProjectView({ id }: { id: string }) {
  const [p, setP] = useState<View | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [choosing, setChoosing] = useState<number | null>(null);

  const design = useCallback(async () => {
    setError(null);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 6000);
    try {
      const res = await fetch(`/api/projects/${id}/design`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Design failed");
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
        if (!body.brief || !body.options?.length) void design();
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
          <button onClick={() => void design()} className="mt-6 rounded-full bg-ink px-6 py-3 text-paper">
            Try again
          </button>
        )}
      </main>
    );

  if (!p || !p.brief || !p.options?.length)
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-24">
        <h1 className="font-serif text-4xl">Designing {p?.title ?? "your space"}</h1>
        <ol className="mt-8 space-y-4">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 ${i > step ? "text-ink-soft/50" : ""}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${i < step ? "bg-leaf" : i === step ? "animate-pulse bg-clay" : "bg-line"}`} />
              {s}
            </li>
          ))}
        </ol>
      </main>
    );

  const b = p.brief;
  const units = p.site.units ?? "imperial";
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24">
      <p className="text-sm uppercase tracking-widest text-ink-soft">{p.title}</p>
      <h1 className="mt-2 font-serif text-5xl sm:text-6xl">{b.name}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">{b.summary}</p>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Palette</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {b.palette.map((c) => (
            <li key={c.hex + c.name} className="overflow-hidden rounded-xl border border-line bg-paper-raised">
              <div className="h-20" style={{ background: c.hex }} />
              <div className="p-3 text-sm">
                <p className="font-medium">{c.name}</p>
                <p className="text-ink-soft">{c.role}</p>
                {c.from.length > 0 && <p className="mt-1 text-xs text-ink-soft">From {c.from.join(", ")}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-paper-raised p-5">
          <h2 className="font-serif text-2xl">Materials</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {b.materials.map((m) => (
              <li key={m.name}>
                <span className="font-medium">{m.name}</span> <span className="text-ink-soft">· {m.where}</span>
                {m.from.length > 0 && <p className="text-xs text-ink-soft">From {m.from.join(", ")}</p>}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-paper-raised p-5">
          <h2 className="font-serif text-2xl">Light</h2>
          <p className="mt-3 text-sm">{b.lighting.mood}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
            {b.lighting.fixtures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-paper-raised p-5">
          <h2 className="font-serif text-2xl">Plants</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {b.plants.map((pl) => (
              <li key={pl.name}>
                <span className="font-medium text-leaf">{pl.name}</span> <span className="text-ink-soft">· {pl.where}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-serif text-3xl">Three plans</h2>
        <p className="mt-2 text-ink-soft">Each one arranges the same rooms differently. Pick the one that fits how you live.</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {p.options.map((layout, i) => (
            <article key={i} className={`rounded-2xl border bg-paper-raised p-4 ${p.chosen_option === i ? "border-clay ring-2 ring-clay/30" : "border-line"}`}>
              <h3 className="font-serif text-2xl">Option {i + 1}</h3>
              {layout.floors.map((f) => (
                <div key={f.level} className="mt-3">
                  {layout.floors.length > 1 && <p className="text-xs uppercase tracking-widest text-ink-soft">{f.level === 0 ? "Ground floor" : "Upstairs"}</p>}
                  <PlanSvg layout={layout} level={f.level} units={units} className="w-full" />
                </div>
              ))}
              <button
                onClick={() => void choose(i)}
                disabled={choosing !== null}
                className={`mt-4 w-full rounded-full px-4 py-2.5 ${p.chosen_option === i ? "bg-clay text-paper" : "bg-ink text-paper"} disabled:opacity-50`}
              >
                {p.chosen_option === i ? "Chosen" : choosing === i ? "Saving…" : "Choose this plan"}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
