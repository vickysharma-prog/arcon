import type { Program, Shell } from "./schema.ts";

// A building rarely fills its lot: there's a front setback and a garden. Size the building to its rooms,
// keep the lot's proportions, and leave the rest of the lot as outdoor space.
const CIRCULATION = 1.2; // rooms plus about 20% for the hall, stairs and walls
const MIN_SIDE = 7; // the layout needs two room strips and a hall

export function buildingShell(program: Program, lot: Shell): Shell {
  const perFloor = Array.from({ length: program.floors }, (_, f) => program.rooms.filter((r) => r.floor === f).reduce((t, r) => t + r.area, 0));
  const need = Math.max(...perFloor) * CIRCULATION;
  const lotArea = lot.width * lot.depth;
  if (need >= lotArea) return lot;
  const s = Math.sqrt(need / lotArea);
  const round = (v: number) => Math.round(v * 10) / 10;
  return { width: round(Math.min(lot.width, Math.max(MIN_SIDE, lot.width * s))), depth: round(Math.min(lot.depth, Math.max(MIN_SIDE, lot.depth * s))) };
}
