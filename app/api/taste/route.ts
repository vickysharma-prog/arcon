import { guestOf } from "@/lib/auth/request";
import { search } from "@/lib/qloo/api";
import { matchesFor, slotOf, vagueHint } from "@/lib/plan-import/taste";

// Looks up one answer to a taste question, so the user sees what it matched before anything is designed.
export async function GET(request: Request) {
  if (!(await guestOf(request.headers.get("cookie")))) return Response.json({ error: "Please reload the page and try again." }, { status: 401 });
  const url = new URL(request.url);
  const slot = slotOf(url.searchParams.get("slot") ?? "");
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (!slot || q.length < 2) return Response.json({ error: "Say a name." }, { status: 400 });
  try {
    const matches = matchesFor(slot.id, q, await search(q, 10, slot.types.join(",")));
    return Response.json({ matches, hint: matches.length ? null : vagueHint(slot.id) });
  } catch {
    return Response.json({ error: "Couldn't look that up just now. Try again in a moment." }, { status: 502 });
  }
}
