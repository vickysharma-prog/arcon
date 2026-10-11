import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import type { Layout, Program, SpaceType } from "../layout/schema.ts";
import type { ReadPlan, ReadRoom } from "./snap.ts";

// Reading someone's floor plan (a photo, a scan or a PDF) into rooms, with a model that can see images.
// The model returns a loose shape (Gemini rejects strict schemas); code checks, scales and cleans it.

export const KINDS = [
  "living", "kitchen", "dining", "bedroom", "bath", "office", "laundry", "storage", "closet", "corridor", "stairs",
  "workspace", "meeting", "reception", "lounge", "counter", "retail", "fitting", "guest-room", "pantry",
] as const;

const LooseRead = z.object({
  width: z.number().describe("the building's width across the drawing, in metres"),
  depth: z.number().describe("the building's depth from the front (street) to the back, in metres"),
  scaleFromDrawing: z.boolean().describe("true if the drawing shows dimensions or a scale bar you used"),
  rooms: z.array(
    z.object({
      name: z.string(),
      kind: z.string().describe(`one of: ${KINDS.join(", ")}`),
      floor: z.number().describe("0 for the ground floor, 1 for the floor above"),
      // Nullable: one room the model couldn't measure must not throw away the whole reading.
      x: z.number().nullable().describe("metres from the left edge of the building to the room's left wall"),
      y: z.number().nullable().describe("metres from the front edge (top of the drawing) to the room's front wall"),
      w: z.number().nullable().describe("room width in metres"),
      h: z.number().nullable().describe("room depth in metres"),
    }),
  ),
  questions: z.array(z.string()).describe("only real doubts to ask the user, one short question each; empty if none"),
});
export type LooseRead = z.infer<typeof LooseRead>;

export type Hints = { spaceType: SpaceType; width?: number; depth?: number; units: "imperial" | "metric" };

const FT = 0.3048;

/**
 * Cleans what the model read: drops impossible rooms, maps unknown kinds to the nearest known one, and scales
 * everything to the size the user gave (their numbers beat the model's reading of the drawing). If the user
 * gave no size and the drawing had no scale, it asks for one.
 */
export function fromModel(raw: LooseRead, hints: Hints): { read: ReadPlan; questions: string[] } {
  const questions = raw.questions.map((q) => q.trim()).filter(Boolean).slice(0, 3);
  const toM = (v: number | undefined) => (v === undefined ? undefined : hints.units === "imperial" ? v * FT : v);
  const userW = toM(hints.width);
  const userD = toM(hints.depth);
  const fx = userW && raw.width > 0 ? userW / raw.width : 1;
  const fy = userD && raw.depth > 0 ? userD / raw.depth : userW && raw.width > 0 ? fx : 1;
  if (!userW && !userD && !raw.scaleFromDrawing)
    questions.unshift(hints.units === "imperial" ? "How wide and how deep is the building, in feet?" : "How wide and how deep is the building, in metres?");
  const kind = (k: string): string => {
    const t = k.toLowerCase().replace(/[^a-z -]/g, "").trim();
    if ((KINDS as readonly string[]).includes(t)) return t;
    if (/bed|master|nursery|kid/.test(t)) return "bedroom";
    if (/bath|wc|toilet|shower|powder|restroom/.test(t)) return "bath";
    if (/hall|corridor|passage|foyer|entry|landing/.test(t)) return "corridor";
    if (/stair/.test(t)) return "stairs";
    if (/kitchen|cook/.test(t)) return "kitchen";
    if (/dining|dinner/.test(t)) return "dining";
    if (/study|office|den/.test(t)) return "office";
    if (/utility|laundry|wash/.test(t)) return "laundry";
    if (/store|storage|closet|wardrobe/.test(t)) return "storage";
    return "living";
  };
  const rooms: ReadRoom[] = raw.rooms
    .filter((r): r is typeof r & { x: number; y: number; w: number; h: number } => [r.x, r.y, r.w, r.h].every((v) => typeof v === "number" && Number.isFinite(v)) && r.w! > 0.3 && r.h! > 0.3)
    .map((r) => ({ name: r.name.trim() || "Room", kind: kind(r.kind), floor: r.floor >= 1 ? 1 : 0, x: r.x * fx, y: r.y * fy, w: r.w * fx, h: r.h * fy }));
  return { read: { spaceType: hints.spaceType, width: (raw.width || 10) * fx, depth: (raw.depth || 10) * fy, rooms }, questions };
}

export function readPrompt(hints: Hints): string {
  return `This is a floor plan of a ${hints.spaceType}. Read every room off it.

Use metres. Put the building's front (the street side, usually the bottom of a drawing with the entrance) at y = 0,
so turn the drawing in your head if the entrance is at the bottom: x runs left to right, y runs from the front
to the back. Give each room as a rectangle (x, y, width w, depth h). For an L-shaped room, give its biggest rectangle.
Include halls and landings as kind "corridor" and the stairs as kind "stairs", with floor 0 or 1.
${hints.width ? `The user says the building is ${hints.width} by ${hints.depth ?? "?"} ${hints.units === "imperial" ? "feet" : "metres"}.` : "If the drawing shows dimensions or a scale bar, use them and set scaleFromDrawing to true."}
Room kinds: ${KINDS.join(", ")}.
Ask a question only if you really can't tell something that matters (for example which floor a room is on,
or what an unlabelled room is for). Never invent rooms that aren't drawn.`;
}

/** Reads a plan image or PDF with a vision model, then cleans the result. */
export async function readPlan(data: Uint8Array, mediaType: string, hints: Hints, model: LanguageModel) {
  const { output } = await generateText({
    model,
    output: Output.object({ schema: LooseRead }),
    messages: [{ role: "user", content: [{ type: "text", text: readPrompt(hints) }, { type: "file", mediaType, data }] }],
  });
  return fromModel(LooseRead.parse(output), hints);
}

/** The room program behind someone's plan: the same rooms at the same sizes, so other layouts can be offered. */
export function programOf(layout: Layout): Program {
  return {
    spaceType: layout.spaceType,
    floors: layout.floors.length,
    rooms: layout.floors.flatMap((f) =>
      f.spaces
        .filter((s) => s.zone !== "circulation")
        .map((s) => ({ id: s.id, name: s.name, kind: s.kind, area: Math.max(2, Math.round(s.rect.w * s.rect.h)), zone: s.zone as "public" | "private" | "service", floor: f.level })),
    ),
  };
}
