import type { Layout, Opening, Space } from "../layout/schema.ts";
import { wallPieces, type Piece } from "../layout/walls.ts";

// Turns a 2D layout into 3D building parts. Plan x stays x; plan y becomes z; y is up. Metres throughout.
export const STOREY = 3.1; // floor-to-floor height
export const WALL_H = 2.8;
export const DOOR_H = 2.1;
export const SILL = 0.9;
export const EYE = 1.6;
const EXT = 0.2; // exterior wall thickness
const INT = 0.1; // interior wall thickness
const EPS = 1e-6;

// Openings that cut a solid wall piece: plan axis "x" openings lie on edges running along x.
const cuts = (run: Piece, openings: Opening[]) =>
  openings
    .map((o) => ({ o, at: o.axis === "x" ? o.y : o.x, c: o.axis === "x" ? o.x : o.y, axis: o.axis === "x" ? "x" : "z" }))
    .filter(({ axis, at, c, o }) => axis === run.axis && Math.abs(at - run.at) < 1e-4 && c - o.width / 2 >= run.from - EPS && c + o.width / 2 <= run.to + EPS)
    .sort((p, q) => p.c - q.c);

// One box of wall: a run along x or z, between two heights.
export type WallBox = { axis: "x" | "z"; at: number; from: number; to: number; y0: number; y1: number; thick: number; exterior: boolean; level: number };
export type Glass = { axis: "x" | "z"; at: number; from: number; to: number; y0: number; y1: number; level: number };
export type Slab = { id: string; kind: string; zone: string; x: number; z: number; w: number; d: number; y: number; level: number };

export function buildWalls(layout: Layout): { walls: WallBox[]; glass: Glass[] } {
  const walls: WallBox[] = [];
  const glass: Glass[] = [];
  for (const floor of layout.floors) {
    const base = floor.level * STOREY;
    // Open-plan stretches (living, dining, kitchen, hall) get no wall at all.
    for (const run of wallPieces(floor, layout.shell).filter((p) => !p.open)) {
      const exterior = run.exterior;
      const thick = exterior ? EXT : INT;
      const box = (from: number, to: number, y0: number, y1: number) =>
        to - from > EPS && walls.push({ axis: run.axis, at: run.at, from, to, y0: base + y0, y1: base + y1, thick, exterior, level: floor.level });
      let cursor = run.from;
      for (const { o, c } of cuts(run, floor.openings)) {
        const a = c - o.width / 2;
        const b = c + o.width / 2;
        box(cursor, a, 0, WALL_H);
        if (o.type === "door") box(a, b, DOOR_H, WALL_H);
        else {
          box(a, b, 0, SILL);
          box(a, b, DOOR_H, WALL_H);
          glass.push({ axis: run.axis, at: run.at, from: a, to: b, y0: base + SILL, y1: base + DOOR_H, level: floor.level });
        }
        cursor = b;
      }
      box(cursor, run.to, 0, WALL_H);
    }
  }
  return { walls, glass };
}

export function buildSlabs(layout: Layout): Slab[] {
  return layout.floors.flatMap((f) =>
    f.spaces.map((s) => ({ id: s.id, kind: s.kind, zone: s.zone, x: s.rect.x, z: s.rect.y, w: s.rect.w, d: s.rect.h, y: f.level * STOREY, level: f.level })),
  );
}

export type Point = [number, number, number];

const centre = (s: Space): [number, number] => [s.rect.x + s.rect.w / 2, s.rect.y + s.rect.h / 2];

// A point just inside `space` from a door on its edge.
function inside(o: Opening, s: Space, by: number): [number, number] {
  if (o.axis === "x") return [o.x, o.y + (centre(s)[1] > o.y ? by : -by)];
  return [o.x + (centre(s)[0] > o.x ? by : -by), o.y];
}

// A first-person walk: from the street, through the front door, a step into every room and back, then upstairs.
// `path` is where the eye goes; `gaze` (same length) is what it looks at at each point: along the hall,
// and into each room from its doorway, so the view shows rooms and furniture rather than the next wall.
// `stops` are the doorway views where the camera slows to take each room in.
export type Walk = { path: Point[]; gaze: Point[]; stops: Point[] };

// Small utility rooms stay in the model but the walk skips them: it's a tour of the rooms people live in.
const SKIP = new Set(["bath", "storage", "closet", "laundry", "server"]);
export const onTour = (s: Space) => s.zone !== "circulation" && !(SKIP.has(s.kind) && s.rect.w * s.rect.h < 12);

export function walkPlan(layout: Layout): Walk {
  const path: Point[] = [];
  const gaze: Point[] = [];
  const stops: Point[] = [];
  const add = (p: Point, g: Point) => {
    path.push(p);
    gaze.push(g);
  };
  const ground = layout.floors.find((f) => f.level === 0) ?? layout.floors[0];
  const entry = ground.openings.find((o) => o.id === "door-entry");
  const hall = ground.spaces.find((s) => s.kind === "corridor");
  if (!entry || !hall) return { path, gaze, stops };
  const look = (s: Space, y: number): Point => [centre(s)[0], y - 0.35, centre(s)[1]];

  const out = inside(entry, hall, -3);
  add([out[0], EYE, out[1]], [entry.x, EYE - 0.2, entry.y]);
  const [ix, iz] = inside(entry, hall, 0.8);
  add([entry.x, EYE, entry.y], look(hall, EYE));
  add([ix, EYE, iz], look(hall, EYE));

  for (const floor of [...layout.floors].sort((a, b) => a.level - b.level)) {
    const y = floor.level * STOREY + EYE;
    const byId = new Map(floor.spaces.map((s) => [s.id, s]));
    const corridor = floor.spaces.find((s) => s.kind === "corridor");
    // One visit per room, through its best way in: from a hall first, then from the living area. Open-plan
    // rooms have several "doors" to their neighbours, and visiting each one replayed the same room.
    const rank = (via: Space) => (via.zone === "circulation" ? 0 : via.zone === "public" ? 1 : 2);
    const best = new Map<string, { o: Opening; room: Space; via: Space }>();
    for (const o of floor.openings) {
      if (o.type !== "door" || o.id === "door-entry" || o.id === "door-stairs") continue;
      for (const [r, v] of [[o.between[0], o.between[1]], [o.between[1], o.between[0]]]) {
        const room = byId.get(r);
        const via = byId.get(v);
        if (!room || !via || !onTour(room)) continue;
        const had = best.get(room.id);
        if (!had || rank(via) < rank(had.via)) best.set(room.id, { o, room, via });
      }
    }
    const doors = [...best.values()];
    // Visit rooms in order along the hall, from the entrance end.
    const along = (o: Opening) => (corridor && corridor.rect.w >= corridor.rect.h ? o.x : o.y);
    const fromEnd = entry.axis === "y" ? (entry.x === 0 ? 1 : -1) : entry.y === 0 ? 1 : -1;
    doors.sort((p, q) => fromEnd * (along(p.o) - along(q.o)));
    for (const { o, room, via } of doors) {
      const [hx, hz] = inside(o, via, 0.6);
      // Stop a step inside the doorway, as a person would, and look across the room.
      const depth = o.axis === "x" ? room.rect.h : room.rect.w;
      const [vx, vz] = inside(o, room, Math.min(0.9, depth / 3));
      const [fx, fz] = inside(o, room, depth - 0.2); // the far wall, straight ahead
      const into: Point = [fx, y - 0.45, fz];
      add([hx, y, hz], [o.x, y - 0.2, o.y]);
      add([o.x, y, o.y], into);
      add([vx, y, vz], into);
      stops.push([vx, y, vz]);
      add([o.x, y, o.y], look(via, y));
      add([hx, y, hz], corridor ? look(corridor, y) : look(via, y));
    }
    const stairs = floor.spaces.find((s) => s.kind === "stairs");
    const nextFloor = layout.floors.find((f) => f.level === floor.level + 1);
    if (stairs && nextFloor) {
      const [sx, sz] = centre(stairs);
      add([sx, y, sz], [sx, y + STOREY, sz]);
      const up = nextFloor.spaces.find((s) => s.kind === "corridor");
      add([sx, y + STOREY, sz], up ? look(up, y + STOREY) : [sx, y + STOREY, sz]);
    }
  }
  return { path, gaze, stops };
}

export const walkPath = (layout: Layout): Point[] => walkPlan(layout).path;

export type StepBox = { x: number; z: number; w: number; d: number; y: number; h: number };

/**
 * A turning stair inside its stairwell: the first flight runs beside the hall up to a landing at the far end,
 * the second runs back up to the floor above. Each box is a solid block from the floor up to its tread.
 * `door` is the stairwell's door, which says which side the hall is on.
 */
export function stairBoxes(rect: { x: number; y: number; w: number; h: number }, door: Opening | undefined, storey = STOREY): StepBox[] {
  // Run along the side the door is on; the hall side is where the door is.
  const alongX = door ? door.axis === "x" : rect.w >= rect.h;
  const run = alongX ? rect.w : rect.h;
  const across = alongX ? rect.h : rect.w;
  const hallAtFar = door ? (alongX ? Math.abs(door.y - (rect.y + rect.h)) < 1e-6 : Math.abs(door.x - (rect.x + rect.w)) < 1e-6) : true;
  const flight = Math.min(1.1, across / 2);
  const landing = Math.min(1.0, run * 0.3);
  const steps = 8;
  const treads = (run - landing) / steps;
  const rise = storey / (2 * steps + 1);
  // Local frame: u along the run (0 = the end by the door), v across (0 = the hall side).
  const doorU = door ? (alongX ? door.x - rect.x : door.y - rect.y) : 0;
  const startAtLow = doorU < run / 2;
  const box = (u0: number, u1: number, v0: number, v1: number, top: number): StepBox => {
    const [a0, a1] = startAtLow ? [u0, u1] : [run - u1, run - u0];
    const [b0, b1] = hallAtFar ? [across - v1, across - v0] : [v0, v1];
    const [x0, x1, z0, z1] = alongX ? [rect.x + a0, rect.x + a1, rect.y + b0, rect.y + b1] : [rect.x + b0, rect.x + b1, rect.y + a0, rect.y + a1];
    return { x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, y: 0, h: top };
  };
  const out: StepBox[] = [];
  for (let i = 0; i < steps; i++) out.push(box(i * treads, (i + 1) * treads, 0, flight, (i + 1) * rise));
  out.push(box(run - landing, run, 0, across, (steps + 1) * rise));
  for (let i = 0; i < steps; i++) out.push(box(run - landing - (i + 1) * treads, run - landing - i * treads, across - flight, across, (steps + 2 + i) * rise));
  return out;
}
