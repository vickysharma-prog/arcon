import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import { planOptionsFor, type Who } from "./options.ts";
import { Program, type Layout, type Shell, type SpaceType } from "../layout/schema.ts";
import { TEMPLATES } from "../layout/templates.ts";
import { validate } from "../layout/validate.ts";
import { buildingShell } from "../layout/footprint.ts";
import type { Project } from "../project/store.ts";
import { runningOf, runningSizes } from "../interview/running.ts";

export const KINDS = [
  "living", "kitchen", "dining", "bedroom", "bath", "office", "laundry", "storage", "closet",
  "workspace", "meeting", "reception", "lounge", "counter", "retail", "fitting", "guest-room",
] as const;

// The model gets a plain schema (providers differ in which JSON-schema limits they accept);
// the strict checks run in code on what comes back.
const LooseRoom = z.object({
  name: z.string(),
  kind: z.enum(KINDS),
  area: z.number().describe("square metres"),
  zone: z.enum(["public", "private", "service"]),
  floor: z.number().describe("0 for the ground floor, 1 for upstairs"),
});
const LooseDraft = z.object({ rooms: z.array(LooseRoom) });
const Room = LooseRoom.extend({ area: z.number().min(2).max(400), floor: z.number().min(0).max(1) });
const Draft = z.object({ rooms: z.array(Room).min(1).max(30) });

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "room";

// Turn a model draft into a valid layout-engine program: unique ids, floors that exist, no empty floor.
export function toProgram(spaceType: SpaceType, floors: number, rooms: z.infer<typeof Room>[]): Program {
  const used = new Map<string, number>();
  const placed = rooms.map((r) => {
    const base = slug(r.name);
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    return { id: n === 1 ? base : `${base}-${n}`, name: r.name, kind: r.kind, area: r.area, zone: r.zone, floor: Math.min(Math.round(r.floor), floors - 1) };
  });
  return Program.parse({ spaceType, floors, rooms: placed });
}

// Up to three valid plans for a program, picked for how this client lives (see options.ts), or null when
// fewer than `min` layout concepts fit the site.
export function optionsFor(program: Program, shell: Shell, who: Who = {}, min = 2): Layout[] | null {
  try {
    if (Array.from({ length: program.floors }, (_, f) => program.rooms.some((r) => r.floor === f)).includes(false)) return null;
    // The tightest building first; if fewer than three layout ideas fit it, let the building grow a little
    // into the lot (as an architect would) and keep whichever size offers the most good plans.
    let best: Layout[] = [];
    for (const grow of [1, 1.1, 1.2, 1.35]) {
      const options = planOptionsFor(program, buildingShell(program, shell, grow), who).filter((o) => validate(o).length === 0);
      if (options.length > best.length) best = options;
      if (best.length >= 3) break;
    }
    return best.length >= min ? best : null;
  } catch {
    return null;
  }
}

// The tested template for a space type, fitted to the number of floors the site has.
export function templateFor(spaceType: SpaceType, floors: number): Program {
  const t = structuredClone(TEMPLATES[spaceType]);
  if (floors === 1) return { ...t, floors: 1, rooms: t.rooms.map((r) => ({ ...r, floor: 0 })) };
  if (t.floors === 2) return t;
  // A one-floor template on two floors: private rooms go upstairs.
  return { ...t, floors: 2, rooms: t.rooms.map((r) => ({ ...r, floor: r.zone === "private" ? 1 : 0 })) };
}

export function programPrompt(p: Project, floors: number): string {
  const shell = `${(p.site.width ?? 0).toFixed(1)} m wide by ${(p.site.depth ?? 0).toFixed(1)} m deep`;
  const example = templateFor(p.space_type ?? "house", floors).rooms.map((r) => ({ name: r.name, kind: r.kind, area: r.area, zone: r.zone, floor: r.floor }));
  const sizes = runningSizes(p.space_type, runningOf(p.interview));
  return `List the rooms this project needs.

Project: a ${p.space_type} on a site ${shell}, ${floors} floor(s) (floor 0 is the ground floor).
What the client told us: ${JSON.stringify(p.interview)}

A typical program for this kind of space, to adapt rather than copy:
${JSON.stringify(example)}

Rules:
- Include every room the client asked for, and the rooms a ${p.space_type} always needs (bathrooms, storage, a kitchen where people live or eat).
- Areas are in square metres. Size rooms for how these people live, not to fill the site: the building is sized to its rooms and the rest of the site becomes garden.
- zone: "public" for shared and guest-facing rooms, "private" for bedrooms and focused work, "service" for baths, laundry, storage and kitchens in businesses.
- Every floor must have at least two rooms. Put a home's bedrooms upstairs when there are two floors.
- No corridors or stairs: the layout adds them.${sizes.length ? `
How they run it, so size the rooms from this:
${sizes.map((l) => `- ${l}`).join("\n")}` : ""}`;
}

export type ProgramResult = { program: Program; options: Layout[]; source: "model" | "template" };

// Ask the model for a program; fall back to the tested template if the draft can't be laid out.
export async function generateProgram(p: Project, model: LanguageModel): Promise<ProgramResult> {
  const spaceType = p.space_type ?? "house";
  const floors = spaceType === "hotel" ? 1 : Math.min(Math.max(p.site.floors ?? 1, 1), 2);
  const shell: Shell = { width: p.site.width ?? 12, depth: p.site.depth ?? 10 };
  try {
    const { output } = await generateText({ model, output: Output.object({ schema: LooseDraft }), prompt: programPrompt(p, floors) });
    const program = toProgram(spaceType, floors, Draft.parse(output).rooms);
    const options = optionsFor(program, shell, p);
    if (options) return { program, options, source: "model" };
  } catch (e) {
    // Fall through to the template, but say why so a broken prompt or schema never hides.
    console.warn("program draft rejected, using the template:", e instanceof Error ? e.message : e);
  }
  const program = templateFor(spaceType, floors);
  const options = optionsFor(program, shell, p, 1);
  if (!options) throw new Error(`a ${spaceType} doesn't fit a ${shell.width.toFixed(1)} by ${shell.depth.toFixed(1)} m site`);
  return { program, options, source: "template" };
}
