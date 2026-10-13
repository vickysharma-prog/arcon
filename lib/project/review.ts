// How a design moves through review, and how the project's own events read in the thread. Pure, so the browser
// and the server say the same thing.

type Status = "interview" | "designing" | "ready" | "review" | "approved" | "building" | "done";

export type ThreadEvent =
  | { type: "chose"; plan: string }
  | { type: "changed"; version: number; note: string }
  | { type: "joined"; role: string }
  | { type: "review"; version: number }
  | { type: "approved"; version: number; note?: string | null }
  | { type: "changes"; version: number; note?: string | null };

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
      return `${who} approved version ${e.version}.${e.note ? ` "${e.note}"` : ""}`;
    case "changes":
      return `${who} asked for changes to version ${e.version}.${e.note ? ` "${e.note}"` : ""}`;
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
