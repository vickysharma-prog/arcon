"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { actionsFor, money, standardSplit, STATUS_LABEL, type FeeAction, type FeeSide, type FeeStatus } from "@/lib/project/fees";
import { ok, tick } from "@/components/fx/sfx";

type Milestone = { id: number; label: string; amount: number; currency: string; status: FeeStatus };

const CURRENCIES = ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"];
const guess = (location?: string | null) =>
  /india|pune|delhi|mumbai|bengaluru|bangalore|hyderabad|chennai|kolkata/i.test(location ?? "") ? "INR"
  : /\b(UK|London|Manchester)\b/i.test(location ?? "") ? "GBP"
  : /dubai|abu dhabi|UAE/i.test(location ?? "") ? "AED"
  : /singapore/i.test(location ?? "") ? "SGD"
  : /australia|sydney|melbourne/i.test(location ?? "") ? "AUD"
  : /canada|toronto|vancouver/i.test(location ?? "") ? "CAD"
  : /germany|berlin|munich/i.test(location ?? "") ? "EUR"
  : "USD";

const BUTTON: Record<FeeAction, string> = { bill: "Mark billed", paid: "I've paid", received: "Received ✓" };
const PILL: Record<FeeStatus, string> = { planned: "bg-line/60 text-ink-soft", billed: "bg-accent/15 text-accent", claimed: "bg-amber-500/15 text-amber-600", received: "bg-leaf/15 text-leaf" };

// Fees between the pro and the person paying: milestones the pro sets out, billed, marked paid, then confirmed.
// Each step also posts in the thread. Hidden for people who are on neither side.
export function Fees({ projectId, location }: { projectId: string; location?: string | null }) {
  const [data, setData] = useState<{ milestones: Milestone[]; side: FeeSide } | null>(null);
  const [total, setTotal] = useState("");
  const [currency, setCurrency] = useState(guess(location));
  const [busy, setBusy] = useState<number | "add" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      fetch(`/api/projects/${projectId}/fees`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setData(d))
        .catch(() => {}),
    [projectId],
  );
  useEffect(() => {
    void load();
  }, [load]);

  if (!data || !data.side || (data.side === "payer" && data.milestones.length === 0)) return null;
  const sum = data.milestones.reduce((s, m) => s + m.amount, 0);
  const got = data.milestones.filter((m) => m.status === "received").reduce((s, m) => s + m.amount, 0);
  const cur = data.milestones[0]?.currency ?? currency;

  async function act(m: Milestone, action: FeeAction) {
    tick();
    setBusy(m.id);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/fees/${m.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    setBusy(null);
    // Refresh either way, so a step someone else just took (or a double click) shows as it is.
    void load();
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "That didn't go through.");
    ok();
  }

  async function add() {
    const n = Number(total.replace(/[^\d.]/g, ""));
    if (!n) return setError("Enter your total fee.");
    setBusy("add");
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/fees`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ currency, items: standardSplit(n) }) });
    setBusy(null);
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't save.");
    ok();
    setTotal("");
    void load();
  }

  return (
    <section className="mt-4 rounded-2xl border border-line bg-paper-raised p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-serif text-2xl">Fees</p>
        {sum > 0 && (
          <p className="text-sm text-ink-soft">
            {money(got, cur)} of {money(sum, cur)} received
          </p>
        )}
      </div>
      {sum > 0 && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
          <motion.div className="h-full bg-leaf" initial={{ width: 0 }} animate={{ width: `${(got / sum) * 100}%` }} transition={{ duration: 0.8 }} />
        </div>
      )}
      {data.milestones.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {data.milestones.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2.5">
              <span className="min-w-0">
                <span className="font-medium">{m.label}</span> <span className="text-ink-soft">· {money(m.amount, m.currency)}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs ${PILL[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                {actionsFor(m.status, data.side).map((a) => (
                  <button key={a} onClick={() => act(m, a)} disabled={busy === m.id} className="rounded-full border border-line px-3 py-1 text-xs transition hover:-translate-y-0.5 hover:border-accent hover:text-accent disabled:opacity-60">
                    {BUTTON[a]}
                  </button>
                ))}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-ink-soft">Set out your fee once: Arcon splits it into design (30%), approval of the final design (40%) and handover (30%). Your client sees what&apos;s due and when.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency" className="rounded-full border border-line bg-paper px-3 py-2 text-sm">
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input value={total} onChange={(e) => setTotal(e.target.value)} inputMode="decimal" placeholder="Your total fee" aria-label="Your total fee" className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2 text-sm outline-none focus:border-accent" />
            <button onClick={add} disabled={busy === "add"} className="glow-btn rounded-full px-5 py-2 text-sm disabled:opacity-60">
              {busy === "add" ? "Saving…" : "Set out my fees"}
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
