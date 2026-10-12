"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { PlanSvg } from "@/components/plan/PlanSvg";
import { Scanning } from "@/components/fx/Motion";
import { ok as okSound, tick } from "@/components/fx/sfx";
import type { Layout } from "@/lib/layout/schema";
import { estimate, marketOf, money, CATEGORY_NAMES, TIER_NAMES, type Tier } from "@/lib/budget/costs";
import { toDxf } from "@/lib/export/dxf";
import { SHOTS, type Shot } from "@/components/three/HouseScene";

const HouseScene = dynamic(() => import("@/components/three/HouseScene"), { ssr: false });

type Project = {
  id: string;
  title: string | null;
  space_type: string | null;
  site: { location?: string };
  interview: Record<string, unknown>;
  brief: unknown;
  taste: { tags?: { value: string }[] } | null;
  options?: Layout[] | null;
  chosen_option: number | null;
};
type View = { name: string; shot: Shot; cutaway: boolean; upTo: number | "all" };

const save = (href: string, name: string) => {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
};
const fileName = (s: string) => s.replace(/[^\w\s-]+/g, "").trim() || "Arcon";

// The last step: everything to hand to an architect or builder, or to send to family. Hand-drawn sketches of the
// design from a few angles (drawn here, in the browser, as pictures to save), the floor plans, a PDF pack with the
// sketches, plans, room list, budget and style, a DXF drawing for CAD, and a link to the walkthrough video.
export function ExportStep({ p, tier, onWalkthrough }: { p: Project; tier: Tier | null; onWalkthrough: () => void }) {
  const still = useReducedMotion();
  const layout = p.options?.[p.chosen_option ?? 0];
  const title = p.title ?? "Your design";
  // The design, not the box: each floor from above with the walls cut, the same from the other side, close-ups of
  // the two biggest rooms with their furniture, and the building from the street.
  const views = useMemo<View[]>(() => {
    if (!layout) return [];
    const two = layout.floors.length > 1;
    const v: View[] = [];
    for (const f of layout.floors) v.push({ name: two ? (f.level ? "Upstairs, from above" : "Ground floor, from above") : "From above", shot: { ...SHOTS.above, level: f.level }, cutaway: true, upTo: f.level });
    v.push({ name: "From the other side", shot: { ...SHOTS.aboveBack, level: 0 }, cutaway: true, upTo: 0 });
    const rooms = layout.floors
      .flatMap((f) => f.spaces.filter((s) => s.zone !== "circulation" && s.kind !== "bath" && s.kind !== "storage").map((s) => ({ s, level: f.level })))
      .sort((a, b) => b.s.rect.w * b.s.rect.h - a.s.rect.w * a.s.rect.h)
      .slice(0, 2);
    for (const { s, level } of rooms) v.push({ name: s.name, shot: { turn: -2.05, tilt: 0.8, level, room: s.rect }, cutaway: true, upTo: level });
    v.push({ name: "From the street", shot: SHOTS.street, cutaway: false, upTo: "all" });
    return v;
  }, [layout]);
  const [shots, setShots] = useState<string[]>([]);
  const drawing = shots.length < views.length ? shots.length : -1;
  const onShot = useCallback((png: string) => {
    okSound();
    setShots((s) => [...s, png]);
  }, []);

  if (!layout) return <p className="p-10 text-center text-ink-soft">Choose a plan first.</p>;
  const units = p.site.location && /\b(US|USA|TX|CA|NY|FL|WA|IL|MA)\b/.test(p.site.location) ? "imperial" : "metric";
  const brief = p.brief as { name?: string; summary?: string } | null;
  const market = marketOf(p.site.location);
  const newBuild = (p.interview?.project as { newBuild?: boolean } | undefined)?.newBuild === true;
  const active: Tier = tier ?? "mid";
  const cost = estimate(layout, active, market, newBuild, p.site.location);
  const rooms = layout.floors.flatMap((f) => f.spaces.filter((s) => s.zone !== "circulation").map((s) => ({ ...s, level: f.level })));
  const words = [...new Set((p.taste?.tags ?? []).map((t) => t.value.replaceAll("_", " ")))].slice(0, 6);

  const dxf = () => {
    tick();
    save(URL.createObjectURL(new Blob([toDxf(layout, title)], { type: "application/dxf" })), `${fileName(title)} plan.dxf`);
  };
  const all = () => shots.forEach((s, i) => setTimeout(() => save(s, `${fileName(title)} sketch ${i + 1}.png`), i * 300));
  const share = async () => {
    tick();
    const files = await Promise.all(shots.map(async (s, i) => new File([await (await fetch(s)).blob()], `sketch-${i + 1}.png`, { type: "image/png" })));
    const text = `${title}: designed with Arcon${brief?.name ? `, in a ${brief.name} style` : ""}.`;
    if (navigator.canShare?.({ files })) await navigator.share({ title, text, files }).catch(() => {});
    else if (navigator.share) await navigator.share({ title, text }).catch(() => {});
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">Share &amp; export</p>
      <h1 className="mt-1 font-serif text-4xl">Take your design with you</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">Hand-drawn sketches to share, the plans and a full PDF pack for your architect or builder, a DXF for CAD, and the walkthrough as a video.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={() => { tick(); window.print(); }} className="glow-btn px-5 py-2.5">
          ⬇ PDF pack
        </button>
        <button type="button" onClick={dxf} className="rounded-full border border-line px-5 py-2.5 transition hover:border-accent hover:text-accent">
          ⬇ DXF for CAD
        </button>
        <button type="button" onClick={onWalkthrough} className="rounded-full border border-line px-5 py-2.5 transition hover:border-accent hover:text-accent">
          ▶ Walkthrough video
        </button>
        <button type="button" disabled={drawing !== -1} onClick={() => void share()} className="rounded-full border border-line px-5 py-2.5 transition hover:border-accent hover:text-accent disabled:opacity-40">
          ↗ Share sketches
        </button>
      </div>

      {/* the sketches, drawn one after another, each kept as a picture */}
      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl">Sketches</h2>
          {drawing === -1 ? (
            <button type="button" onClick={all} className="text-sm text-accent hover:underline">
              Download all
            </button>
          ) : (
            <p className="font-mono text-xs text-ink-soft">
              &gt; drawing sketch {drawing + 1} of {views.length}: {views[drawing].name.toLowerCase()}
            </p>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {views.map((v, i) => (
            <figure key={v.name} className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="relative aspect-[4/3]">
                {shots[i] ? (
                  <motion.img initial={still ? false : { opacity: 0, filter: "blur(6px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} src={shots[i]} alt={`${title}, ${v.name.toLowerCase()}, hand-drawn sketch`} className="h-full w-full object-cover" />
                ) : i === drawing ? (
                  <HouseScene key={i} layout={layout} mode="shot" sketch="print" shot={v.shot} cutaway={v.cutaway} upTo={v.upTo} playing={false} onShot={onShot} />
                ) : (
                  <div className="grid h-full place-items-center">
                    <Scanning label="Waiting to draw" />
                  </div>
                )}
              </div>
              <figcaption className="flex items-center justify-between border-t border-line px-4 py-2 text-sm text-ink">
                {v.name}
                {shots[i] && (
                  <button type="button" onClick={() => save(shots[i], `${fileName(title)} ${v.name.toLowerCase()}.png`)} className="text-accent hover:underline">
                    ⬇ PNG
                  </button>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Floor plans</h2>
        <div className={`mt-4 grid gap-4 ${layout.floors.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {layout.floors.map((f) => (
            <figure key={f.level} className="rounded-2xl border border-line bg-paper-raised p-4">
              <PlanSvg layout={layout} level={f.level} units={units} className="h-auto w-full" />
              <figcaption className="mt-2 text-sm text-ink-soft">{f.level === 0 ? "Ground floor" : "Upstairs"}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* the PDF: printed on white whatever the theme, one section per page */}
      <div className="print-sheet" aria-hidden>
        <section className="print-page">
          <p className="text-xs uppercase tracking-[0.3em]">Arcon · design pack</p>
          <h1 className="mt-2 font-serif text-5xl">{title}</h1>
          <p className="mt-2">
            {[p.site.location, brief?.name && `${brief.name} style`, `${Math.round(cost.area)} m²`, new Date().toLocaleDateString()].filter(Boolean).join(" · ")}
          </p>
          {brief?.summary && <p className="mt-4 max-w-2xl">{brief.summary}</p>}
          {words.length > 0 && <p className="mt-2 text-sm">Taste words, read through Qloo: {words.join(", ")}</p>}
          {shots[0] && <img src={shots[0]} alt="" className="mt-6 w-full" />}
        </section>
        {shots.length > 1 && (
          <section className="print-page grid grid-cols-2 gap-3">
            {shots.slice(1).map((s, i) => (
              <figure key={i}>
                <img src={s} alt="" className="w-full border" />
                <figcaption className="text-xs">{views[i + 1]?.name}</figcaption>
              </figure>
            ))}
          </section>
        )}
        {layout.floors.map((f) => (
          <section key={f.level} className="print-page">
            <h2 className="font-serif text-3xl">{f.level === 0 ? "Ground floor plan" : "Upstairs plan"}</h2>
            <PlanSvg layout={layout} level={f.level} units={units} className="mt-4 h-auto w-full" />
          </section>
        ))}
        <section className="print-page">
          <h2 className="font-serif text-3xl">Rooms</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-1">Room</th>
                <th>Floor</th>
                <th>Size</th>
                <th className="text-right">Area</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-1">{r.name}</td>
                  <td>{r.level ? "Upstairs" : "Ground"}</td>
                  <td>
                    {r.rect.w.toFixed(1)} × {r.rect.h.toFixed(1)} m
                  </td>
                  <td className="text-right">{(r.rect.w * r.rect.h).toFixed(1)} m²</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2 className="mt-10 font-serif text-3xl">Budget</h2>
          <p className="mt-2">
            {TIER_NAMES[active]} finish: <strong>{money(cost.total.low, market)} to {money(cost.total.high, market)}</strong>, including fees. An early estimate, not a quote.
          </p>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {Object.entries(cost.byCategory)
                .filter(([, v]) => (v ?? 0) > 0)
                .map(([k, v]) => (
                  <tr key={k} className="border-b">
                    <td className="py-1">{CATEGORY_NAMES[k as keyof typeof CATEGORY_NAMES]}</td>
                    <td className="text-right">{money(v ?? 0, market)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
