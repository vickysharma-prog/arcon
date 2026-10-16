// How a design moves through review, and how the project's own events read in the thread. Pure, so the browser
// and the server say the same thing.

type Status = "interview" | "designing" | "ready" | "review" | "approved" | "building" | "done";

export type ThreadEvent =
  | { type: "chose"; plan: string }
  | { type: "changed"; version: number; note: string }
  | { type: "joined"; role: string }
  | { type: "review"; version: number }
  | { type: "approved"; version: number; note?: string | null; for?: string | null }
  | { type: "changes"; version: number; note?: string | null; for?: string | null }
  | { type: "fee"; action: "added" | "bill" | "paid" | "received"; label: string; amount: string }
  | { type: "handover"; to: string }
  | { type: "site"; what: "started" | "phase" | "update" | "finished"; name?: string; pct?: number; note?: string };

/** One line for the thread: "Priya approved version 3." */
export function eventText(e: ThreadEvent, who: string): string {
  switch (e.type) {
    case "chose":
      return `${who} chose the ${e.plan} plan.`;
    case "changed":
      return `${who} changed the design: ${e.note} (version ${e.version}).`;
    case "joined":
      return `${who} joined as the ${e.role}.`;
    case "review":
      return `${who} sent version ${e.version} for review.`;
    case "approved":
      // `for`: a client who isn't on Arcon, whose answer the pro records from their meeting
      return e.for ? `${e.for} approved version ${e.version} in person (recorded by ${who}).${e.note ? ` "${e.note}"` : ""}` : `${who} approved version ${e.version}.${e.note ? ` "${e.note}"` : ""}`;
    case "changes":
      return e.for ? `${e.for} asked for changes to version ${e.version} in person (recorded by ${who}).${e.note ? ` "${e.note}"` : ""}` : `${who} asked for changes to version ${e.version}.${e.note ? ` "${e.note}"` : ""}`;
    case "fee":
      return e.action === "added"
        ? `${who} set out the fees: ${e.label} (${e.amount}).`
        : e.action === "bill"
          ? `${who} billed ${e.label}: ${e.amount}.`
          : e.action === "paid"
            ? `${who} marked ${e.label} as paid (${e.amount}).`
            : `${who} confirmed receiving ${e.label} (${e.amount}).`;
    case "site":
      return e.what === "started"
        ? `${who} started the building site. First up: ${e.name}.`
        : e.what === "phase"
          ? `${who} finished ${e.name}.`
          : e.what === "finished"
            ? `${who} finished the build. Time to move in.`
            : `Site update from ${who}${e.name ? ` (${e.name}${e.pct !== undefined ? `, ${e.pct}%` : ""})` : ""}: ${e.note}`;
    case "handover":
      return `${who} handed the project over to ${e.to}, who now runs it. ${who} stays on as the client.`;
  }
}

/** A design can go for review once a plan is chosen and it isn't already in review, approved or being built. */
export const canSendForReview = (p: { status: Status; chosen_option: number | null }) => p.chosen_option !== null && (p.status === "designing" || p.status === "ready");

/** Where the project goes after each review step. A change after review or approval needs approving again. */
export function statusAfter(step: "send" | "approve" | "changes" | "edit", now: Status): Status {
  if (step === "send") return "review";
  if (step === "approve") return "approved";
  if (step === "changes") return "ready";
  return now === "review" || now === "approved" ? "ready" : now;
}
