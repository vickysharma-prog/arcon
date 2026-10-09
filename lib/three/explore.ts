import type { Layout } from "../layout/schema.ts";
import { buildWalls, STOREY } from "./geometry.ts";

// Free walking inside the model: the walls a person can't pass on one floor, and a step that stops at
// them. Door gaps have only a lintel above head height, so they stay open; window sills block.

export type Rect = { x0: number; x1: number; z0: number; z1: number };
const BODY = 0.25; // a person's radius, in metres

export function blockers(layout: Layout, level: number): Rect[] {
  return buildWalls(layout)
    .walls.filter((w) => w.level === level && Math.abs(w.y0 - level * STOREY) < 1e-6)
    .map((w) =>
      w.axis === "x"
        ? { x0: w.from, x1: w.to, z0: w.at - w.thick / 2, z1: w.at + w.thick / 2 }
        : { x0: w.at - w.thick / 2, x1: w.at + w.thick / 2, z0: w.from, z1: w.to },
    );
}

const hits = (x: number, z: number, walls: Rect[], r: number) => walls.some((b) => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r);

/** Where a step from (x, z) by (dx, dz) ends: the full step, or a slide along the wall, or no move. */
export function step(x: number, z: number, dx: number, dz: number, walls: Rect[], r = BODY): [number, number] {
  // Short sub-steps, so a fast step can't jump through a thin wall.
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.05));
  for (let i = 0; i < n; i++) {
    const sx = dx / n;
    const sz = dz / n;
    if (!hits(x + sx, z + sz, walls, r)) {
      x += sx;
      z += sz;
    } else if (!hits(x + sx, z, walls, r)) x += sx;
    else if (!hits(x, z + sz, walls, r)) z += sz;
    else break;
  }
  return [x, z];
}
