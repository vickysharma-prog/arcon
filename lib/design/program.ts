import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import { planOptions } from "../layout/place.ts";
import { Program, type Layout, type Shell, type SpaceType } from "../layout/schema.ts";
import { TEMPLATES } from "../layout/templates.ts";
import { validate } from "../layout/validate.ts";
import { buildingShell } from "../layout/footprint.ts";
import type { Project } from "../project/store.ts";

export const KINDS = [
  "living", "kitchen", "dining", "bedroom", "bath", "office", "laundry", "storage", "closet",
  "workspace", "meeting", "reception", "lounge", "counter", "retail", "fitting", "guest-room",
] as const;

const Room = z.object({
  name: z.string(),
  kind: z.enum(KINDS),
  area: z.number().min(2).max(400).describe("square metres"),
  zone: z.enum(["public", "private", "service"]),
  floor: z.number().int().min(0).max(1),
});
const Draft = z.object({ rooms: z.array(Room).min(1).max(30) });

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "room";

// Turn a model draft into a valid layout-engine program: unique ids, floors that exist, no empty floor.
export function toProgram(spaceType: SpaceType, floors: number, rooms: z.infer<typeof Room>[]): Program {
  const used = new Map<string, number>();
  const placed = rooms.map((r) => {
    const base = slug(r.name);
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    return { id: n === 1 ? base : `${base}-${n}`, name: r.name, kind: r.kind, area: r.area, zone: r.zone, floor: Math.min(r.floor, floors - 1) };
  });
  return Program.parse({ spaceType, floors, rooms: placed });
}

// Three valid plan options for a program, or null if the program can't be laid out in this shell.
export function optionsFor(program: Program, shell: Shell): Layout[] | null {
  try {
    if (Array.from({ length: program.floors }, (_, f) => program.rooms.some((r) => r.floor === f)).includes(false)) return null;
    const options = planOptions(program, buildingShell(program, shell));
    return options.every((o) => validate(o).length === 0) ? options : null;
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
- No corridors or stairs: the layout adds them.`;
}

export type ProgramResult = { program: Program; options: Layout[]; source: "model" | "template" };

// Ask the model for a program; fall back to the tested template if the draft can't be laid out.
export async function generateProgram(p: Project, model: LanguageModel): Promise<ProgramResult> {
  const spaceType = p.space_type ?? "house";
  const floors = spaceType === "hotel" ? 1 : Math.min(Math.max(p.site.floors ?? 1, 1), 2);
  const shell: Shell = { width: p.site.width ?? 12, depth: p.site.depth ?? 10 };
  try {
    const { output } = await generateText({ model, output: Output.object({ schema: Draft }), prompt: programPrompt(p, floors) });
    const program = toProgram(spaceType, floors, output.rooms);
    const options = optionsFor(program, shell);
    if (options) return { program, options, source: "model" };
  } catch {
    // fall through to the template
  }
  const program = templateFor(spaceType, floors);
  const options = optionsFor(program, shell);
  if (!options) throw new Error(`a ${spaceType} doesn't fit a ${shell.width.toFixed(1)} by ${shell.depth.toFixed(1)} m site`);
  return { program, options, source: "template" };
}
