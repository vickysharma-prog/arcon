"use client";

import { useEffect, useMemo, useState } from "react";
import type { Layout } from "@/lib/layout/schema";
import { CATEGORY_NAMES, estimate, knownMarket, marketOf, MARKETS, money, TIER_NAMES, TIERS, type Category, type Tier } from "@/lib/budget/costs";
import type { PriceSignal } from "@/lib/budget/tier";

type Props = { id: string; layout: Layout; location: string | null | undefined; interview: Record<string, unknown> | null };

// What the chosen plan will cost: a range for the whole job, by trade and by room, at a quality tier read from the
// price of what they love. The tier can be changed; the estimate follows at once.
export function BudgetStep({ id, layout, location, interview }: Props) {
  const [taste, setTaste] = useState<{ tier: Tier; signals: PriceSignal[] } | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [marketId, setMarketId] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/projects/${id}/budget`)
      .then((r) => (r.ok ? r.json() : { tier: "mid", signals: [] }))
      .then((b) => live && setTaste(b))
      .catch(() => live && setTaste({ tier: "mid", signals: [] }));
    return () => {
      live = false;
    };
  }, [id]);

  const market = MARKETS.find((m) => m.id === marketId) ?? marketOf(location);
  const newBuild = (interview?.project as { newBuild?: boolean } | undefined)?.newBuild === true;
  const said = Object.values((interview?.budget ?? {}) as Record<string, unknown>).filter((v) => typeof v === "string" || typeof v === "number");
  const active = tier ?? taste?.tier ?? "mid";
  const e = useMemo(() => estimate(layout, active, market, newBuild), [layout, active, market, newBuild]);
  const cats = (Object.entries(e.byCategory) as [Category, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const top = Math.max(...cats.map(([, v]) => v));
  const fmt = (v: number) => money(v, market);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-2">
      <p className="text-sm uppercase tracking-widest text-ink-soft">Budget · {market.name}</p>
      <h1 className="mt-3 font-serif text-5xl sm:text-6xl">
        {fmt(e.total.low)} to {fmt(e.total.high)}
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        {newBuild ? "Building and fitting out" : "Fitting out"} {Math.round(e.area)} m² at {TIER_NAMES[active].toLowerCase()} quality, in{" "}
        {market.currency}. An early estimate from typical {market.name} costs, not a quote: builders&apos; prices vary by about this range.
        {!location ? " We don't know where it is yet: pick the country below." : !knownMarket(location) ? " We don't have costs for this country yet, so these are US costs." : ""}
      </p>
      <label className="mt-3 inline-flex items-center gap-2 text-sm">
        <span className="text-ink-soft">Costs for</span>
        <select value={market.id} onChange={(ev) => setMarketId(ev.target.value)} className="rounded-full border border-line bg-paper-raised px-3 py-1">
          {MARKETS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.currency})
            </option>
          ))}
        </select>
      </label>

      <section className="mt-8 rounded-2xl border border-line bg-paper-raised p-5" aria-labelledby="tier">
        <h2 id="tier" className="font-serif text-2xl">Quality</h2>
        {taste === null ? (
          <p className="mt-2 text-sm text-ink-soft">Reading the price of what you love…</p>
        ) : taste.signals.length ? (
          <p className="mt-2 text-sm">
            We started at <strong>{TIER_NAMES[taste.tier].toLowerCase()}</strong> because you love{" "}
            {taste.signals.map((s, i) => (
              <span key={s.name}>
                {i > 0 && (i === taste.signals.length - 1 ? " and " : ", ")}
                {s.name} ({s.says})
              </span>
            ))}
            .
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">Nothing you love tells us a price level, so we started at mid-range.</p>
        )}
        {said.length > 0 && <p className="mt-1 text-sm text-ink-soft">You told us: {said.join(", ")}.</p>}
        <div role="radiogroup" aria-label="Quality tier" className="mt-4 flex flex-wrap gap-2">
          {TIERS.map((t) => (
            <button
              key={t}
              role="radio"
              aria-checked={active === t}
              onClick={() => setTier(t)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${active === t ? "border-btn bg-btn text-btn-ink" : "border-line hover:bg-paper"}`}
            >
              {TIER_NAMES[t]}
              {taste?.tier === t && <span className="opacity-70"> · your taste</span>}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-paper-raised p-5" aria-labelledby="by-trade">
          <h2 id="by-trade" className="font-serif text-2xl">By trade</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {cats.map(([c, v]) => (
              <li key={c}>
                <div className="flex justify-between gap-4">
                  <span>{CATEGORY_NAMES[c]}</span>
                  <span className="tabular-nums">{fmt(v)}</span>
                </div>
                <div aria-hidden className="mt-1 h-1.5 rounded-full bg-line">
                  <div className="h-1.5 rounded-full bg-btn" style={{ width: `${(v / top) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-paper-raised p-5" aria-labelledby="by-room">
          <h2 id="by-room" className="font-serif text-2xl">By room</h2>
          <table className="mt-3 w-full text-sm">
            <caption className="sr-only">Cost of each room</caption>
            <tbody>
              {[...e.rooms].sort((a, b) => b.total - a.total).map((r) => (
                <tr key={r.id} className="border-t border-line first:border-0">
                  <td className="py-2">{r.name}</td>
                  <td className="py-2 text-ink-soft">{Math.round(r.area)} m²</td>
                  <td className="py-2 text-right tabular-nums">{fmt(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-ink-soft">Room figures are before design fees and contingency{newBuild ? " and the building itself" : ""}.</p>
        </section>
      </div>
    </main>
  );
}
