import type { Floor, Layout, Opening, Rect, Space } from "./schema.ts";

const EPS = 1e-6;

// Smallest allowed side of a space, in metres.
const MIN_SIDE: Record<string, number> = { bath: 1.5, corridor: 0.9, stairs: 0.9, storage: 1.2 };
const minSide = (kind: string) => MIN_SIDE[kind] ?? 2.1;

// Rooms that don't need a window.
const NO_WINDOW = new Set(["bath", "storage", "corridor", "stairs", "closet", "server"]);

const overlapArea = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

// Does the segment of an opening lie on one edge of this rect?
function onEdge(o: Opening, r: Rect): boolean {
  const lo = (o.axis === "x" ? o.x : o.y) - o.width / 2;
  const hi = lo + o.width;
  if (o.axis === "x") {
    const onLine = Math.abs(o.y - r.y) < EPS || Math.abs(o.y - (r.y + r.h)) < EPS;
    return onLine && lo >= r.x - EPS && hi <= r.x + r.w + EPS;
  }
  const onLine = Math.abs(o.x - r.x) < EPS || Math.abs(o.x - (r.x + r.w)) < EPS;
  return onLine && lo >= r.y - EPS && hi <= r.y + r.h + EPS;
}

function checkFloor(layout: Layout, floor: Floor, errors: string[]) {
  const { width, depth } = layout.shell;
  const shell: Rect = { x: 0, y: 0, w: width, h: depth };
  const byId = new Map<string, Space>(floor.spaces.map((s) => [s.id, s]));
  const at = `floor ${floor.level}`;

  for (const s of floor.spaces) {
    const r = s.rect;
    if (r.x < -EPS || r.y < -EPS || r.x + r.w > width + EPS || r.y + r.h > depth + EPS)
      errors.push(`${at}: ${s.id} is outside the shell`);
    if (Math.min(r.w, r.h) < minSide(s.kind) - EPS)
      errors.push(`${at}: ${s.id} is narrower than ${minSide(s.kind)} m`);
  }

  for (let i = 0; i < floor.spaces.length; i++)
    for (let j = i + 1; j < floor.spaces.length; j++)
      if (overlapArea(floor.spaces[i].rect, floor.spaces[j].rect) > EPS)
        errors.push(`${at}: ${floor.spaces[i].id} overlaps ${floor.spaces[j].id}`);

  for (const o of floor.openings) {
    for (const id of o.between) {
      const r = id === "outside" ? shell : byId.get(id)?.rect;
      if (!r) errors.push(`${at}: ${o.id} joins unknown space ${id}`);
      else if (!onEdge(o, r)) errors.push(`${at}: ${o.id} is not on a wall of ${id}`);
    }
  }

  for (const s of floor.spaces)
    if (!NO_WINDOW.has(s.kind) && !floor.openings.some((o) => o.type === "window" && o.between.includes(s.id)))
      errors.push(`${at}: ${s.id} has no window`);

  // Every space must be reachable through doors: from the street on the ground floor, from the stairs above it.
  const start = floor.level === 0 ? "outside" : floor.spaces.find((s) => s.kind === "stairs")?.id;
  if (!start) {
    errors.push(`${at}: no stairs reach this floor`);
    return;
  }
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const here = queue.shift()!;
    for (const o of floor.openings)
      if (o.type === "door" && o.between.includes(here)) {
        const next = o.between[0] === here ? o.between[1] : o.between[0];
        if (!seen.has(next)) seen.add(next), queue.push(next);
      }
  }
  for (const s of floor.spaces) if (!seen.has(s.id)) errors.push(`${at}: ${s.id} can't be reached`);
}

export function validate(layout: Layout): string[] {
  const errors: string[] = [];
  for (const floor of layout.floors) checkFloor(layout, floor, errors);
  if (layout.floors.length > 1) {
    const stairs = layout.floors.map((f) => f.spaces.find((s) => s.kind === "stairs")?.rect);
    const [a, b] = stairs;
    if (!a || !b || a.x !== b.x || a.y !== b.y || a.w !== b.w || a.h !== b.h)
      errors.push("stairs don't line up between floors");
  }
  return errors;
}
