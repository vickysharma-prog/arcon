import type { Layout } from "../layout/schema.ts";

// The plan as a DXF drawing that architects can open in any CAD program: each room as a closed outline with its name
// and area, doors and windows as short lines across the wall, one layer per kind of thing, and the floors set side
// by side. Plain DXF R12 (LINE and TEXT only), in metres, so even old readers open it.

const GAP = 4; // metres between floors laid side by side

function pairs(code: number, value: string | number) {
  return `${code}\n${typeof value === "number" ? +value.toFixed(4) : value}\n`;
}
const line = (layer: string, x1: number, y1: number, x2: number, y2: number) =>
  pairs(0, "LINE") + pairs(8, layer) + pairs(10, x1) + pairs(20, y1) + pairs(30, 0) + pairs(11, x2) + pairs(21, y2) + pairs(31, 0);
const text = (layer: string, x: number, y: number, h: number, value: string) =>
  pairs(0, "TEXT") + pairs(8, layer) + pairs(10, x) + pairs(20, y) + pairs(30, 0) + pairs(40, h) + pairs(1, value.replace(/[\r\n]+/g, " "));

/** The layout as a DXF file. y runs up in CAD, so the street side (y = 0 in the plan) ends up at the bottom. */
export function toDxf(layout: Layout, title: string): string {
  const { width: W, depth: D } = layout.shell;
  let body = "";
  layout.floors.forEach((f, i) => {
    const ox = i * (W + GAP);
    const flip = (y: number) => D - y;
    body += text("TITLE", ox, D + 1.2, 0.5, `${title} - ${f.level === 0 ? "Ground floor" : "Upstairs"}`);
    body += text("TITLE", ox, -1.2, 0.3, "Made with Arcon - Spaces designed around who you are");
    // the building outline
    for (const [x1, y1, x2, y2] of [[0, 0, W, 0], [W, 0, W, D], [W, D, 0, D], [0, D, 0, 0]]) body += line("WALLS", ox + x1, y1, ox + x2, y2);
    for (const s of f.spaces) {
      const { x, y, w, h } = s.rect;
      const layer = s.zone === "circulation" ? "CIRCULATION" : "ROOMS";
      for (const [x1, y1, x2, y2] of [[x, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y]]) body += line(layer, ox + x1, flip(y1), ox + x2, flip(y2));
      if (s.zone !== "circulation") {
        const size = Math.max(0.18, Math.min(0.35, w / 12));
        body += text("LABELS", ox + x + 0.2, flip(y + h / 2) + size * 0.6, size, s.name);
        body += text("LABELS", ox + x + 0.2, flip(y + h / 2) - size * 0.8, size * 0.8, `${(w * h).toFixed(1)} m2`);
      }
    }
    for (const o of f.openings) {
      const half = o.width / 2;
      const layer = o.type === "door" ? "DOORS" : "WINDOWS";
      body += o.axis === "x" ? line(layer, ox + o.x - half, flip(o.y), ox + o.x + half, flip(o.y)) : line(layer, ox + o.x, flip(o.y - half), ox + o.x, flip(o.y + half));
    }
  });
  // $INSUNITS 6 = metres
  const header = pairs(0, "SECTION") + pairs(2, "HEADER") + pairs(9, "$ACADVER") + pairs(1, "AC1009") + pairs(9, "$INSUNITS") + pairs(70, 6) + pairs(0, "ENDSEC");
  return header + pairs(0, "SECTION") + pairs(2, "ENTITIES") + body + pairs(0, "ENDSEC") + pairs(0, "EOF");
}
