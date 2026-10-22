import type { DemoRole } from "./story.ts";

// The judges' tour: one stop per page, as the person whose view it is. Pure, so the /demo route, the judge bar and
// the tests agree. Paths name projects by key; the /demo route fills in the seeded ids.

export type ProjectKey = "maya" | "parks" | "ana" | "sam";
export type Stop = { as: DemoRole; path: string; title: string; what: string };

export const TOUR: Stop[] = [
  { as: "maya", path: "/start?demo=1", title: "Maya tells Arcon how her family lives", what: "The interview plays itself with Maya's answers. Her three picks go to Qloo as she taps them." },
  { as: "maya", path: "/project/{maya}?step=brief", title: "Qloo reads her taste", what: "Chateau Marmont, West Elm and Mad Men become style words, materials and brands. Each choice says which pick it came from." },
  { as: "maya", path: "/project/{maya}?step=plans", title: "Three plans, each with its reasons", what: "Drawn by Arcon's layout engine from her answers and ranked by how well each fits how the family lives, with the trade-offs on every card." },
  { as: "maya", path: "/project/{maya}?step=walkthrough", title: "Walk through it in 3D", what: "Furniture in her style, day and night. Drag to look around, click a room label to fly there." },
  { as: "maya", path: "/project/{maya}?step=budget", title: "A budget in dollars, room by room", what: "Los Angeles rates, three finish levels, and how long the build takes." },
  { as: "maya", path: "/project/{maya}?step=shop", title: "A shopping list from her taste", what: "Every piece in the 3D, priced, from brands Qloo matched to what Maya loves, each saying which pick it came from." },
  { as: "maya", path: "/project/{maya}?step=drawings", title: "Drawings for the builder", what: "Plans, elevations and schedules, as a PDF and as DXF for CAD, made from the same design as the 3D." },
  { as: "lena", path: "/home", title: "Lena's studio", what: "The architect's side: every client by stage, what's waiting on her, and her fees." },
  { as: "lena", path: "/project/{maya}?tab=thread", title: "One thread for everyone", what: "Maya's approval, Mike's quote, Lena's site visits and every change, in order." },
  { as: "mike", path: "/home?view=today", title: "Mike's day on site", what: "The builder's side: today's crew, deliveries, and fees ready to bill." },
  { as: "mike", path: "/project/{maya}?tab=site", title: "The building site", what: "Phases on a timeline, crew and materials in sq ft and pounds, each finished stage signed off by Lena." },
  { as: "lena", path: "/project/{ana}?tab=site", title: "The last week before moving in", what: "Ana's apartment: the snag list (one fixed, two to go), the handover pack, and the keys waiting for Ana to accept." },
  { as: "sam", path: "/project/{sam}?step=brief#neighbourhood", title: "A café, read against its street", what: "Sam's Brooklyn café, designed by Sam alone: Qloo reads who already comes to the cafés nearby, by age, and ranks them against Sam's taste." },
];

/** A stop's real path, with the seeded project ids filled in. */
export const pathOf = (stop: Stop, ids: Partial<Record<ProjectKey, string>>) => stop.path.replace(/\{(\w+)\}/g, (_, k: ProjectKey) => ids[k] ?? "");

/** The stop for a step number from a URL (1-based), kept in range. */
export const stopAt = (n: number) => Math.min(TOUR.length, Math.max(1, Math.trunc(n) || 1));

// Who is on which project, so switching role keeps the page when that person is on it too.
const ON: Record<ProjectKey, DemoRole[]> = { maya: ["maya", "lena", "mike"], parks: ["lena"], ana: ["lena", "mike"], sam: ["sam"] };

/** Where a role switch lands: the same project page if they're on it, otherwise their home. */
export function switchTo(as: DemoRole, from: string, ids: Partial<Record<ProjectKey, string>>): string {
  const id = from.match(/^\/project\/([0-9a-f-]{36})/)?.[1];
  const key = (Object.keys(ids) as ProjectKey[]).find((k) => ids[k] === id);
  return key && ON[key].includes(as) ? from : "/home";
}
