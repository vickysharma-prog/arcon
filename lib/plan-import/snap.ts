import type { Floor, Layout, Opening, Shell, Space, SpaceType } from "../layout/schema.ts";
import { validate } from "../layout/validate.ts";

// Turns the rooms a model read off someone's floor plan into a clean Layout: edges that almost meet are joined,
// gaps the model left become halls, every room gets a door and (where it needs one) a window, and the front door
// goes on the street side. The validator then says, in plain words, what still needs the user's eye.

/** One room as read from the drawing, in metres, x across and y from the front (street) edge back. */
export type ReadRoom = { name: string; kind: string; floor: number; x: number; y: number; w: number; h: number };
export type ReadPlan = { spaceType: SpaceType; width: number; depth: number; rooms: ReadRoom[] };

const SNAP = 0.35; // edges closer than this are the same wall
const DOOR = 0.9;
const ENTRY = 1.0;
const MIN_ROOM = 0.6;

const ZONE: Record<string, Space["zone"]> = {
  living: "public", lounge: "public", kitchen: "public", dining: "public", reception: "public", retail: "public",
  counter: "public", meeting: "public", fitting: "public",
  bedroom: "private", "guest-room": "private", office: "private", workspace: "private",
  bath: "service", laundry: "service", storage: "service", closet: "service", pantry: "service",
  corridor: "circulation", stairs: "circulation",
};
const NO_WINDOW = new Set(["bath", "storage", "closet", "corridor", "stairs", "pantry"]);
const PRIVATE = new Set(["bedroom", "guest-room", "bath", "office"]);

// Millimetre precision, so edges that should meet compare exactly.
const mm = (v: number) => Math.round(v * 1000) / 1000;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "room";

/** Joins edge positions that are within SNAP of each other (and of the outer walls) onto one value. */
function snapper(values: number[], ends: number[]): (v: number) => number {
  const sorted = [...values].sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const v of sorted) {
    const g = groups.at(-1);
    if (g && v - g[g.length - 1] <= SNAP) g.push(v);
    else groups.push([v]);
  }
  const centres = groups.map((g) => {
    const end = ends.find((e) => g.some((v) => Math.abs(v - e) <= SNAP));
    return { lo: g[0], hi: g[g.length - 1], at: end ?? Math.round((g.reduce((t, v) => t + v, 0) / g.length) * 20) / 20 };
  });
  return (v) => centres.find((c) => v >= c.lo - 1e-9 && v <= c.hi + 1e-9)?.at ?? v;
}

/** The floor's uncovered area as rectangles (on the grid of room edges), merged along rows. */
function gaps(spaces: Space[], W: number, D: number): { x: number; y: number; w: number; h: number }[] {
  const xs = [...new Set([0, W, ...spaces.flatMap((s) => [s.rect.x, s.rect.x + s.rect.w])])].sort((a, b) => a - b);
  const ys = [...new Set([0, D, ...spaces.flatMap((s) => [s.rect.y, s.rect.y + s.rect.h])])].sort((a, b) => a - b);
  const covered = (cx: number, cy: number) => spaces.some((s) => cx > s.rect.x && cx < s.rect.x + s.rect.w && cy > s.rect.y && cy < s.rect.y + s.rect.h);
  const out: { x: number; y: number; w: number; h: number }[] = [];
  for (let j = 0; j + 1 < ys.length; j++) {
    let run: { x: number; w: number } | null = null;
    for (let i = 0; i + 1 <= xs.length; i++) {
      const free = i + 1 < xs.length && !covered((xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2);
      if (free && run) run.w = xs[i + 1] - run.x;
      else if (free) run = { x: xs[i], w: xs[i + 1] - xs[i] };
      else if (run) {
        out.push({ x: run.x, y: ys[j], w: run.w, h: ys[j + 1] - ys[j] });
        run = null;
      }
    }
  }
  // Stack row pieces with the same x span into taller rectangles.
  const merged: typeof out = [];
  for (const g of out) {
    const above = merged.find((m) => Math.abs(m.x - g.x) < 1e-9 && Math.abs(m.w - g.w) < 1e-9 && Math.abs(m.y + m.h - g.y) < 1e-9);
    if (above) above.h += g.h;
    else merged.push({ ...g });
  }
  return merged.filter((g) => g.w * g.h > 0.05).map((g) => ({ x: mm(g.x), y: mm(g.y), w: mm(g.w), h: mm(g.h) }));
}

/** The stretch of wall two rectangles share, if any: a line along x or y, from..to. */
function shared(a: Space["rect"], b: Space["rect"]): { axis: "x" | "y"; at: number; from: number; to: number } | null {
  const ox = [Math.max(a.x, b.x), Math.min(a.x + a.w, b.x + b.w)];
  const oy = [Math.max(a.y, b.y), Math.min(a.y + a.h, b.y + b.h)];
  if (Math.abs(a.y + a.h - b.y) < 1e-6 || Math.abs(b.y + b.h - a.y) < 1e-6) {
    const at = Math.abs(a.y + a.h - b.y) < 1e-6 ? b.y : a.y;
    return ox[1] - ox[0] > 1e-6 ? { axis: "x", at, from: ox[0], to: ox[1] } : null;
  }
  if (Math.abs(a.x + a.w - b.x) < 1e-6 || Math.abs(b.x + b.w - a.x) < 1e-6) {
    const at = Math.abs(a.x + a.w - b.x) < 1e-6 ? b.x : a.x;
    return oy[1] - oy[0] > 1e-6 ? { axis: "y", at, from: oy[0], to: oy[1] } : null;
  }
  return null;
}

/** The parts of a room's edges that are outside walls, longest first. */
function facades(r: Space["rect"], W: number, D: number) {
  const out: { axis: "x" | "y"; at: number; from: number; to: number; front: boolean }[] = [];
  if (Math.abs(r.y) < 1e-6) out.push({ axis: "x", at: 0, from: r.x, to: r.x + r.w, front: true });
  if (Math.abs(r.y + r.h - D) < 1e-6) out.push({ axis: "x", at: D, from: r.x, to: r.x + r.w, front: false });
  if (Math.abs(r.x) < 1e-6) out.push({ axis: "y", at: 0, from: r.y, to: r.y + r.h, front: false });
  if (Math.abs(r.x + r.w - W) < 1e-6) out.push({ axis: "y", at: W, from: r.y, to: r.y + r.h, front: false });
  return out.sort((a, b) => b.to - b.from - (a.to - a.from));
}

const opening = (id: string, type: Opening["type"], between: [string, string], line: { axis: "x" | "y"; at: number }, mid: number, width: number): Opening =>
  line.axis === "x" ? { id, type, between, x: mid, y: line.at, axis: "x", width } : { id, type, between, x: line.at, y: mid, axis: "y", width };

function buildFloor(level: number, rooms: ReadRoom[], W: number, D: number, sx: (v: number) => number, sy: (v: number) => number): Floor {
  const used = new Set<string>();
  const spaces: Space[] = [];
  for (const r of rooms) {
    const x0 = Math.max(0, sx(r.x));
    const x1 = Math.min(W, sx(r.x + r.w));
    const y0 = Math.max(0, sy(r.y));
    const y1 = Math.min(D, sy(r.y + r.h));
    if (x1 - x0 < MIN_ROOM || y1 - y0 < MIN_ROOM) continue;
    let id = slug(r.name);
    for (let n = 2; used.has(id); n++) id = `${slug(r.name)}-${n}`;
    used.add(id);
    const kind = ZONE[r.kind] ? r.kind : "living";
    spaces.push({ id, name: r.name, kind, zone: ZONE[kind], rect: { x: mm(x0), y: mm(y0), w: mm(x1 - x0), h: mm(y1 - y0) } });
  }
  // Whatever the drawing left between rooms is circulation: a hall or landing.
  gaps(spaces, W, D).forEach((g, i) => spaces.push({ id: i ? `hall-${i + 1}` : "hall", name: "Hall", kind: "corridor", zone: "circulation", rect: g }));

  const openings: Opening[] = [];
  const doorBetween = (a: Space, b: Space) => {
    if (openings.some((o) => o.type === "door" && o.between.includes(a.id) && o.between.includes(b.id))) return true;
    const s = shared(a.rect, b.rect);
    if (!s || s.to - s.from < DOOR + 0.1) return false;
    openings.push(opening(`door-${a.id}`, "door", [a.id, b.id], s, s.from + 0.1 + DOOR / 2, DOOR));
    return true;
  };
  // Each room opens onto a hall if it can, then a living space (never the kitchen for a private room).
  for (const room of spaces.filter((s) => s.zone !== "circulation")) {
    const order = spaces
      .filter((n) => n !== room)
      .filter((n) => n.kind !== "stairs" && !(PRIVATE.has(room.kind) && n.kind === "kitchen"))
      .sort((p, q) => rankOf(p) - rankOf(q));
    for (const n of order) if (doorBetween(room, n)) break;
  }
  // Stairs and extra halls join the hall they touch.
  for (const s of spaces.filter((x) => x.zone === "circulation" && x.id !== "hall")) {
    const n = spaces.find((o) => o !== s && o.zone === "circulation" && shared(s.rect, o.rect));
    if (n) doorBetween(s, n);
  }
  // Windows on the longest outside wall of every room that needs one.
  for (const room of spaces.filter((s) => !NO_WINDOW.has(s.kind))) {
    const f = facades(room.rect, W, D)[0];
    if (f) openings.push(opening(`win-${room.id}`, "window", [room.id, "outside"], f, (f.from + f.to) / 2, Math.min((f.to - f.from) * 0.5, 2.4)));
  }
  if (level === 0) {
    // The front door: on the street side, into a hall or a living space.
    const candidates = spaces.filter((s) => s.zone === "circulation" ? s.kind === "corridor" : ["living", "lounge", "dining", "reception", "retail", "counter"].includes(s.kind));
    for (const s of candidates.sort((p, q) => rankOf(p) - rankOf(q))) {
      const f = facades(s.rect, W, D).sort((a, b) => Number(b.front) - Number(a.front))[0];
      if (!f || f.to - f.from < ENTRY + 0.2) continue;
      const mid = f.from + 0.1 + ENTRY / 2;
      // Keep clear of this room's window on the same wall: move the window to what's left.
      const win = openings.find((o) => o.id === `win-${s.id}` && o.axis === f.axis && Math.abs((f.axis === "x" ? o.y : o.x) - f.at) < 1e-6);
      if (win) {
        const from = f.from + 0.1 + ENTRY + 0.3;
        win.width = Math.min((f.to - from) * 0.7, 2.4);
        if (f.axis === "x") win.x = (from + f.to) / 2;
        else win.y = (from + f.to) / 2;
        if (win.width < 0.4) openings.splice(openings.indexOf(win), 1);
      }
      openings.push(opening("door-entry", "door", [s.id, "outside"], f, mid, ENTRY));
      break;
    }
  }
  return { level, spaces, openings };
}

// Halls first, then living spaces, then anything else.
const rankOf = (s: Space) => (s.zone === "circulation" ? 0 : s.zone === "public" && s.kind !== "kitchen" ? 1 : s.kind === "kitchen" ? 3 : 2);

// For a user's own plan, the building is what it is: a small powder room or a windowless study is their
// reality, not an error. Only problems that break the model itself block it; the rest are advice.
const ADVICE = /narrower than|smaller than|has no window|opens off the kitchen|opens into the stairs|front door opens into/;

/**
 * A Layout from what was read. `problems` must be fixed before the plan can be used (overlaps, holes, rooms
 * you can't reach); `advice` is what an architect would point out, shown but not blocking.
 */
export function snapPlan(read: ReadPlan): { layout: Layout; problems: string[]; advice: string[] } {
  const W = read.width;
  const D = read.depth;
  const levels = [...new Set(read.rooms.map((r) => r.floor))].sort((a, b) => a - b);
  // One stair serves both floors: read the upper stairwell as exactly the lower one.
  const rooms = read.rooms.map((r) => ({ ...r }));
  const low = rooms.find((r) => r.kind === "stairs" && r.floor === levels[0]);
  const high = rooms.find((r) => r.kind === "stairs" && r.floor === levels[1]);
  if (low && high) Object.assign(high, { x: low.x, y: low.y, w: low.w, h: low.h });
  // Walls stack between floors, so edges are joined across all floors at once.
  const sx = snapper(rooms.flatMap((r) => [r.x, r.x + r.w]), [0, W]);
  const sy = snapper(rooms.flatMap((r) => [r.y, r.y + r.h]), [0, D]);
  const floors = levels.map((level, i) => ({ ...buildFloor(i, rooms.filter((r) => r.floor === level), W, D, sx, sy), level: i }));
  const layout: Layout = { spaceType: read.spaceType, shell: { width: W, depth: D } as Shell, floors, concept: { id: "own", name: "Your plan", why: [] } };
  const all = validate(layout);
  return { layout, problems: all.filter((e) => !ADVICE.test(e)), advice: all.filter((e) => ADVICE.test(e)) };
}
