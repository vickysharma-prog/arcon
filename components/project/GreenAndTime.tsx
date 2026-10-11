"use client";

import { useEffect, useMemo, useState } from "react";
import type { Layout, Shell } from "@/lib/layout/schema";
import type { Brief } from "@/lib/design/brief";
import type { Profile } from "@/lib/qloo/taste";
import type { Tier } from "@/lib/budget/costs";
import { timeline } from "@/lib/budget/timeline";
import { greenery } from "@/lib/green/score";
import type { EcoBrand, Nursery } from "@/lib/green/eco";
import { furnish } from "@/lib/three/furniture";
import { look } from "@/lib/three/materials";

type Props = { id: string; layout: Layout; brief: Brief | null; taste: Profile | null; lot: Shell | null; tier: Tier; newBuild: boolean; said: string[] };

// How long it takes, and how green it is: a phase chart, then the greenery score with one tip per room, the eco
// brands in their taste and plant nurseries near the site.
export function GreenAndTime({ id, layout, brief, taste, lot, tier, newBuild, said }: Props) {
  const [eco, setEco] = useState<{ brands: EcoBrand[]; nurseries: Nursery[] } | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/projects/${id}/green`)
      .then((r) => (r.ok ? r.json() : { brands: [], nurseries: [] }))
      .then((b) => live && setEco(b))
      .catch(() => live && setEco({ brands: [], nurseries: [] }));
    return () => {
      live = false;
    };
  }, [id]);

  const t = useMemo(() => timeline(layout, tier, newBuild), [layout, tier, newBuild]);
  // The same furniture the 3D shows, so the plants counted are the plants you see.
  const g = useMemo(() => greenery(layout, furnish(layout, { lush: look(brief, taste).lush }), brief?.plants ?? [], lot), [layout, brief, taste, lot]);
  const months = Math.round((t.weeks / 4.35) * 2) / 2;

  return (
    <>
      <section className="mt-8 rounded-2xl border border-line bg-paper-raised p-5" aria-labelledby="timeline">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="timeline" className="font-serif text-2xl">Timeline</h2>
          <p className="text-sm text-ink-soft">
            About {t.weeks} weeks ({months} months) from design to handover
          </p>
        </div>
        {said.length > 0 && <p className="mt-1 text-sm text-ink-soft">You told us: {said.join(", ")}.</p>}
        <ol className="mt-4 space-y-2">
          {t.phases.map((ph) => (
            <li key={ph.id} className="grid grid-cols-[minmax(0,11rem)_1fr] items-center gap-3 text-sm">
              <span title={ph.note}>{ph.name}</span>
              <div className="relative h-6 rounded-full bg-line/50" aria-label={`Week ${ph.start + 1} to ${ph.start + ph.weeks}`}>
                <div
                  className="absolute top-0 h-6 rounded-full bg-btn px-2 text-xs leading-6 text-btn-ink"
                  style={{ left: `${(ph.start / t.weeks) * 100}%`, width: `${(ph.weeks / t.weeks) * 100}%` }}
                >
                  {ph.weeks}w
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-ink-soft">Typical durations for this size and quality. Permits and deliveries vary most.</p>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-paper-raised p-5" aria-labelledby="green">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-leaf" aria-hidden>
            <span className="font-serif text-3xl text-leaf">{g.score}</span>
          </div>
          <div>
            <h2 id="green" className="font-serif text-2xl">Greenery: {g.score} out of 100</h2>
            <p className="text-sm text-ink-soft">
              Plants per room, how well they suit each room&apos;s light, how many kinds, and how easy they are to keep
              {g.garden ? `, plus ${Math.round(g.garden.area)} m² of garden` : ""}.
            </p>
            {g.species.length > 0 && <p className="mt-1 text-sm">Your plants: {g.species.join(", ")}.</p>}
          </div>
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {g.rooms.map((r) => (
            <li key={r.id} className="rounded-xl border border-line p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{r.name}</span>
                <span className="tabular-nums text-leaf">{r.score}</span>
              </div>
              <p className="text-ink-soft">
                {r.light} light · {r.plants} plant{r.plants === 1 ? "" : "s"}
                {r.pick ? ` · ${r.pick.name.toLowerCase()}` : ""}
              </p>
              {r.tip && <p className="mt-1">{r.tip}</p>}
            </li>
          ))}
        </ul>

        {eco && (eco.brands.length > 0 || eco.nurseries.length > 0) && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {eco.brands.length > 0 && (
              <div>
                <h3 className="font-serif text-xl">Brands in your taste that care</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {eco.brands.slice(0, 5).map((b) => (
                    <li key={b.name}>
                      <span className="font-medium">{b.name}</span>
                      <span className="text-ink-soft">{b.loved ? " · you love it" : b.via.length ? ` · matched to ${b.via.slice(0, 2).join(" and ")}` : ""}</span>
                      <p className="text-ink-soft">{b.does.join(", ")}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {eco.nurseries.length > 0 && (
              <div>
                <h3 className="font-serif text-xl">Plant nurseries near you</h3>
                <p className="text-xs text-ink-soft">Ranked for your taste.</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {eco.nurseries.map((n) => (
                    <li key={n.name}>
                      <span className="font-medium">{n.name}</span>
                      {n.address && <p className="text-ink-soft">{n.address}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
