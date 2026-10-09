import type { Layout, Opening, Space } from "../layout/schema.ts";
import { STOREY } from "./geometry.ts";

// Simple furniture and plants for each room, as boxes and cylinders the 3D view can style from the brief.
// Role decides the colour: wood, textile, metal, accent, base, or plant.
export type Role = "wood" | "textile" | "metal" | "accent" | "base" | "plant" | "pot";
export type Item = { room: string; name: string; shape: "box" | "cyl" | "ball"; x: number; z: number; y: number; w: number; d: number; h: number; role: Role; level: number };

// Pieces in room-local terms: fx, fz are fractions of the room (0 = near the wall at the room's back), sizes in metres.
type Piece = { name: string; fx: number; fz: number; w: number; d: number; h: number; role: Role; shape?: Item["shape"]; lift?: number };

const SETS: Record<string, Piece[]> = {
  bedroom: [
    { name: "bed", fx: 0.5, fz: 0.32, w: 1.6, d: 2.0, h: 0.5, role: "textile" },
    { name: "headboard", fx: 0.5, fz: 0.05, w: 1.7, d: 0.08, h: 1.1, role: "wood" },
    { name: "side table", fx: 0.18, fz: 0.1, w: 0.45, d: 0.4, h: 0.5, role: "wood" },
    { name: "side table", fx: 0.82, fz: 0.1, w: 0.45, d: 0.4, h: 0.5, role: "wood" },
  ],
  "guest-room": [
    { name: "bed", fx: 0.5, fz: 0.32, w: 1.6, d: 2.0, h: 0.5, role: "textile" },
    { name: "headboard", fx: 0.5, fz: 0.05, w: 1.7, d: 0.08, h: 1.1, role: "wood" },
    { name: "desk", fx: 0.8, fz: 0.85, w: 1.0, d: 0.5, h: 0.75, role: "wood" },
  ],
  living: [
    { name: "sofa", fx: 0.5, fz: 0.18, w: 2.2, d: 0.9, h: 0.8, role: "textile" },
    { name: "coffee table", fx: 0.5, fz: 0.45, w: 1.1, d: 0.6, h: 0.4, role: "wood" },
    { name: "rug", fx: 0.5, fz: 0.42, w: 2.6, d: 1.8, h: 0.02, role: "accent" },
    { name: "armchair", fx: 0.85, fz: 0.45, w: 0.8, d: 0.8, h: 0.8, role: "accent" },
    { name: "media unit", fx: 0.5, fz: 0.92, w: 1.8, d: 0.4, h: 0.5, role: "wood" },
  ],
  lounge: [
    { name: "sofa", fx: 0.5, fz: 0.2, w: 2.0, d: 0.9, h: 0.8, role: "textile" },
    { name: "coffee table", fx: 0.5, fz: 0.5, w: 1.0, d: 0.6, h: 0.4, role: "wood" },
  ],
  kitchen: [
    { name: "counter", fx: 0.5, fz: 0.08, w: 3.0, d: 0.6, h: 0.9, role: "base" },
    { name: "upper cabinets", fx: 0.5, fz: 0.05, w: 3.0, d: 0.35, h: 0.7, role: "wood", lift: 1.5 },
    { name: "island", fx: 0.5, fz: 0.6, w: 1.8, d: 0.9, h: 0.9, role: "wood" },
  ],
  dining: [
    { name: "dining table", fx: 0.5, fz: 0.5, w: 1.8, d: 0.9, h: 0.75, role: "wood" },
    { name: "pendant", fx: 0.5, fz: 0.5, w: 0.5, d: 0.5, h: 0.3, role: "metal", shape: "cyl", lift: 1.8 },
    { name: "chair", fx: 0.3, fz: 0.25, w: 0.45, d: 0.45, h: 0.85, role: "textile" },
    { name: "chair", fx: 0.7, fz: 0.25, w: 0.45, d: 0.45, h: 0.85, role: "textile" },
    { name: "chair", fx: 0.3, fz: 0.75, w: 0.45, d: 0.45, h: 0.85, role: "textile" },
    { name: "chair", fx: 0.7, fz: 0.75, w: 0.45, d: 0.45, h: 0.85, role: "textile" },
  ],
  bath: [
    { name: "vanity", fx: 0.3, fz: 0.1, w: 0.9, d: 0.5, h: 0.85, role: "wood" },
    { name: "shower", fx: 0.75, fz: 0.25, w: 0.9, d: 0.9, h: 0.05, role: "base" },
    { name: "toilet", fx: 0.75, fz: 0.75, w: 0.4, d: 0.65, h: 0.45, role: "base" },
  ],
  office: [
    { name: "desk", fx: 0.5, fz: 0.15, w: 1.5, d: 0.7, h: 0.75, role: "wood" },
    { name: "chair", fx: 0.5, fz: 0.35, w: 0.55, d: 0.55, h: 0.9, role: "metal" },
    { name: "bookshelf", fx: 0.85, fz: 0.75, w: 0.9, d: 0.35, h: 1.9, role: "wood" },
  ],
  workspace: [
    { name: "desk row", fx: 0.5, fz: 0.25, w: 3.2, d: 0.8, h: 0.75, role: "wood" },
    { name: "desk row", fx: 0.5, fz: 0.65, w: 3.2, d: 0.8, h: 0.75, role: "wood" },
  ],
  meeting: [{ name: "meeting table", fx: 0.5, fz: 0.5, w: 2.4, d: 1.1, h: 0.75, role: "wood" }],
  reception: [{ name: "reception desk", fx: 0.5, fz: 0.3, w: 2.0, d: 0.7, h: 1.05, role: "wood" }],
  counter: [{ name: "service counter", fx: 0.5, fz: 0.4, w: 2.6, d: 0.7, h: 1.05, role: "wood" }],
  retail: [
    { name: "display table", fx: 0.35, fz: 0.5, w: 1.6, d: 0.9, h: 0.8, role: "wood" },
    { name: "display table", fx: 0.7, fz: 0.5, w: 1.6, d: 0.9, h: 0.8, role: "wood" },
  ],
  laundry: [{ name: "washer and dryer", fx: 0.4, fz: 0.15, w: 1.3, d: 0.65, h: 0.9, role: "base" }],
  storage: [{ name: "shelving", fx: 0.5, fz: 0.15, w: 1.2, d: 0.45, h: 1.9, role: "metal" }],
};

const PLANTS: Piece[] = [
  { name: "plant pot", fx: 0.9, fz: 0.1, w: 0.4, d: 0.4, h: 0.4, role: "pot", shape: "cyl" },
  { name: "plant", fx: 0.9, fz: 0.1, w: 0.7, d: 0.7, h: 0.8, role: "plant", shape: "ball", lift: 0.4 },
];

// The room's "back" is the wall facing its door, so furniture sits against it and the door stays clear.
function orient(room: Space, door: Opening | undefined) {
  const { x, y, w, h } = room.rect;
  if (!door) return { origin: [x, y], u: [1, 0], v: [0, 1], W: w, D: h };
  if (door.axis === "x") {
    const doorAtTop = Math.abs(door.y - y) < 1e-6;
    return doorAtTop ? { origin: [x + w, y + h], u: [-1, 0], v: [0, -1], W: w, D: h } : { origin: [x, y], u: [1, 0], v: [0, 1], W: w, D: h };
  }
  const doorAtLeft = Math.abs(door.x - x) < 1e-6;
  return doorAtLeft ? { origin: [x + w, y], u: [0, 1], v: [-1, 0], W: h, D: w } : { origin: [x, y + h], u: [0, -1], v: [1, 0], W: h, D: w };
}

const overlaps = (a: { x: number; z: number; w: number; d: number }, b: { x: number; z: number; w: number; d: number }) =>
  Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.z - b.z) * 2 < a.d + b.d;

export function doorClearance(door: Opening, room: Space) {
  const into = 0.85;
  const cx = room.rect.x + room.rect.w / 2;
  const cz = room.rect.y + room.rect.h / 2;
  if (door.axis === "x") return { x: door.x, z: door.y + (cz > door.y ? into / 2 : -into / 2), w: door.width + 0.4, d: into };
  return { x: door.x + (cx > door.x ? into / 2 : -into / 2), z: door.y, w: into, d: door.width + 0.4 };
}

type Box = { x: number; z: number; w: number; d: number };
function slideClear(box: Box, clear: Box, room: Space, turned: boolean): Box | null {
  const { x, y, w, h } = room.rect;
  // Pieces slide along the wall they stand against: along x unless the room is turned.
  const options = turned
    ? [clear.z - clear.d / 2 - box.d / 2 - 0.02, clear.z + clear.d / 2 + box.d / 2 + 0.02].map((z) => ({ ...box, z }))
    : [clear.x - clear.w / 2 - box.w / 2 - 0.02, clear.x + clear.w / 2 + box.w / 2 + 0.02].map((nx) => ({ ...box, x: nx }));
  return (
    options.find((b) => b.x - b.w / 2 >= x && b.x + b.w / 2 <= x + w && b.z - b.d / 2 >= y && b.z + b.d / 2 <= y + h && !overlaps(b, clear)) ?? null
  );
}

export function furnish(layout: Layout): Item[] {
  const items: Item[] = [];
  for (const floor of layout.floors) {
    const base = floor.level * STOREY;
    for (const room of floor.spaces.filter((s) => s.zone !== "circulation")) {
      const door = floor.openings.find((o) => o.type === "door" && o.between[0] === room.id);
      const { origin, u, v, W, D } = orient(room, door);
      // Keep the door's swing clear: 0.85 m into the room, a little wider than the door.
      const clear = door ? doorClearance(door, room) : null;
      for (const p of [...(SETS[room.kind] ?? []), ...PLANTS]) {
        const w = Math.min(p.w, W - 0.3);
        const d = Math.min(p.d, D - 0.3);
        if (w <= 0.2 || d <= 0.2) continue;
        const lx = Math.min(Math.max(p.fx * W, w / 2 + 0.1), W - w / 2 - 0.1);
        const lz = Math.min(Math.max(p.fz * D, d / 2 + 0.1), D - d / 2 - 0.1);
        const X = origin[0] + u[0] * lx + v[0] * lz;
        const Z = origin[1] + u[1] * lx + v[1] * lz;
        const turned = u[0] === 0;
        let box = { x: X, z: Z, w: turned ? d : w, d: turned ? w : d };
        if (clear && overlaps(box, clear)) {
          // Slide the piece sideways along its wall to clear the door; drop it only if it can't fit either side.
          const moved = slideClear(box, clear, room, turned);
          if (!moved) continue;
          box = moved;
        }
        items.push({ room: room.id, name: p.name, shape: p.shape ?? "box", ...box, y: base + (p.lift ?? 0), h: p.h, role: p.role, level: floor.level });
      }
    }
  }
  return items;
}
