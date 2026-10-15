// "Waiting on you": what each person needs to do next across their projects, from facts the home page already has.
// Most urgent first: a review to answer, changes asked, money to pay or confirm, work running late, then messages.

export type Wait = { projectId: string; kind: "review" | "changes" | "choose" | "pay" | "confirm" | "late" | "messages"; text: string; href: string };

export type WaitInput = {
  id: string;
  name: string;
  role: "owner" | "architect" | "client" | "builder" | "viewer";
  mode: string;
  status: string;
  chosen: boolean;
  /** this person answers reviews on it (a client, or the owner when there's no client) */
  decides: boolean;
  /** the last review answer was "changes", and nothing has been sent since */
  changesAsked: boolean;
  unread: number;
  late: number;
  fees: { label: string; status: string; amount: string }[];
};

const ORDER: Wait["kind"][] = ["review", "changes", "pay", "confirm", "late", "choose", "messages"];

export function waitsFor(projects: WaitInput[]): Wait[] {
  const out: Wait[] = [];
  for (const p of projects) {
    const at = `/project/${p.id}`;
    // the side that pays: the owner or client; the side that's paid: the architect or builder (or owner in pro mode)
    const pays = p.role === "client" || (p.role === "owner" && p.mode !== "pro");
    const paid = p.role === "architect" || p.role === "builder" || (p.role === "owner" && p.mode === "pro");
    const designs = p.role === "architect" || (p.role === "owner" && p.mode !== "pro");
    if (p.status === "review" && p.decides) out.push({ projectId: p.id, kind: "review", text: `Review the design for ${p.name}`, href: `${at}?tab=thread` });
    if (p.changesAsked && designs && p.status !== "review") out.push({ projectId: p.id, kind: "changes", text: `Changes asked on ${p.name}`, href: `${at}?tab=thread` });
    for (const f of p.fees) {
      if (f.status === "billed" && pays) out.push({ projectId: p.id, kind: "pay", text: `Pay ${f.amount}, ${f.label}, ${p.name}`, href: at });
      if (f.status === "claimed" && paid) out.push({ projectId: p.id, kind: "confirm", text: `Confirm ${f.amount} received, ${f.label}, ${p.name}`, href: at });
    }
    if (p.late > 0 && (p.role === "builder" || p.role === "owner")) out.push({ projectId: p.id, kind: "late", text: `${p.late} ${p.late === 1 ? "thing" : "things"} behind on ${p.name}`, href: `${at}?tab=site` });
    if (!p.chosen && (p.status === "designing" || p.status === "ready") && designs) out.push({ projectId: p.id, kind: "choose", text: `Choose a plan for ${p.name}`, href: `${at}?step=plans` });
    if (p.unread > 0) out.push({ projectId: p.id, kind: "messages", text: `${p.unread} new ${p.unread === 1 ? "message" : "messages"} on ${p.name}`, href: `${at}?tab=thread` });
  }
  return out.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}

/** The one line at the top of the home page: how many projects, where they stand, and what's waiting. */
export function statusLine(stages: string[], waiting: number): string {
  if (!stages.length) return "no projects yet";
  const counts = new Map<string, number>();
  for (const s of stages) counts.set(s, (counts.get(s) ?? 0) + 1);
  const parts = [...counts].map(([s, n]) => `${n} in ${s.toLowerCase()}`);
  parts.push(waiting ? `${waiting} waiting on you` : "nothing waiting on you");
  return parts.join(" · ");
}
