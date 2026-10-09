"use client";

import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { mix } from "@/lib/three/materials";

// Surface textures painted on a canvas in the brief's colours: wood planks, tiles, brick, limewash,
// wallpaper and framed art. Nothing to download, and every one follows the client's palette.

const cache = new Map<string, CanvasTexture>();
const rand = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function paint(key: string, size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, wrap = true) {
  if (!cache.has(key)) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    draw(c.getContext("2d")!, size);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    if (wrap) t.wrapS = t.wrapT = RepeatWrapping;
    cache.set(key, t);
  }
  return cache.get(key)!;
}

/** A copy of a cached texture tiled to cover w by h metres, at `unit` metres per tile (`unitY` if taller). */
export function tiled(t: Texture, w: number, h: number, unit: number, unitY = unit) {
  const c = t.clone();
  c.repeat.set(w / unit, h / unitY);
  c.needsUpdate = true;
  return c;
}

/** Wood planks, 4 boards across one tile, staggered joints and grain. Stretch it along the boards for real lengths. */
export const planks = (wood: string) =>
  paint(`planks${wood}`, 512, (g, s) => {
    const rows = 4;
    const bh = s / rows;
    for (let r = 0; r < rows; r++) {
      const shift = rand(r) * s;
      for (let k = -1; k < 2; k++) {
        const x = shift + k * s * 0.75;
        const tone = mix(wood, rand(r * 7 + k) > 0.5 ? "#ffffff" : "#000000", 0.04 + rand(r * 3 + k) * 0.1);
        g.fillStyle = tone;
        g.fillRect(x, r * bh, s * 0.75, bh);
        g.strokeStyle = mix(tone, "#000000", 0.12);
        g.lineWidth = 1;
        for (let i = 0; i < 9; i++) {
          const y = r * bh + 4 + rand(r * 31 + k * 5 + i) * (bh - 8);
          g.beginPath();
          g.moveTo(x, y);
          g.bezierCurveTo(x + s * 0.25, y + 3 - rand(i) * 6, x + s * 0.5, y - 3 + rand(i + 1) * 6, x + s * 0.75, y);
          g.stroke();
        }
        g.fillStyle = mix(wood, "#000000", 0.45);
        g.fillRect(x, r * bh, 2, bh);
      }
      g.fillStyle = mix(wood, "#000000", 0.5);
      g.fillRect(0, r * bh, s, 2);
    }
  });

/** Square tiles with grout lines; zellige gets uneven glaze, marble gets veins. */
export const tiles = (color: string, kind: string, per = 4) =>
  paint(`tiles${color}${kind}${per}`, 512, (g, s) => {
    const t = s / per;
    g.fillStyle = mix(color, "#ffffff", 0.5);
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < per; i++)
      for (let j = 0; j < per; j++) {
        const n = rand(i * 17 + j * 3);
        g.fillStyle = kind === "zellige" ? mix(color, n > 0.5 ? "#ffffff" : "#000000", n * 0.25) : mix(color, "#ffffff", n * 0.06);
        g.fillRect(i * t + 2, j * t + 2, t - 4, t - 4);
      }
    if (kind === "marble") {
      g.strokeStyle = "rgba(120,120,125,0.35)";
      for (let v = 0; v < 6; v++) {
        g.lineWidth = 1 + rand(v) * 2;
        g.beginPath();
        let x = rand(v + 9) * s;
        g.moveTo(x, 0);
        for (let y = 0; y <= s; y += 32) g.lineTo((x += (rand(v * 9 + y) - 0.5) * 40), y);
        g.stroke();
      }
    }
  });

export const brick = (color: string) =>
  paint(`brick${color}`, 512, (g, s) => {
    g.fillStyle = "#d8d2c8";
    g.fillRect(0, 0, s, s);
    const rows = 8;
    const bh = s / rows;
    for (let r = 0; r < rows; r++)
      for (let k = -1; k < 4; k++) {
        const x = k * (s / 4) + (r % 2) * (s / 8);
        g.fillStyle = mix(color, rand(r * 11 + k) > 0.5 ? "#000000" : "#ffffff", rand(r * 5 + k) * 0.18);
        g.fillRect(x + 3, r * bh + 3, s / 4 - 6, bh - 6);
      }
  });

/** Soft, cloudy limewash or plaster. */
export const limewash = (color: string) =>
  paint(`lime${color}`, 256, (g, s) => {
    g.fillStyle = color;
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      const x = rand(i) * s;
      const y = rand(i + 500) * s;
      const r = 10 + rand(i + 900) * 40;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `${mix(color, rand(i + 7) > 0.5 ? "#ffffff" : "#000000", 0.12)}55`);
      grad.addColorStop(1, `${color}00`);
      g.fillStyle = grad;
      for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
    }
  });

/** A quiet botanical wallpaper: leaf sprigs on the feature colour. */
export const wallpaper = (ground: string, leaf: string) =>
  paint(`paper${ground}${leaf}`, 512, (g, s) => {
    g.fillStyle = ground;
    g.fillRect(0, 0, s, s);
    g.strokeStyle = g.fillStyle = mix(leaf, ground, 0.35);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        const cx = (i + (j % 2) * 0.5) * (s / 4) + s / 8;
        const cy = j * (s / 4) + s / 8;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(cx, cy + 40);
        g.quadraticCurveTo(cx + 8, cy, cx, cy - 40);
        g.stroke();
        for (let k = 0; k < 4; k++)
          for (const side of [-1, 1]) {
            g.beginPath();
            g.ellipse(cx + side * 12, cy + 28 - k * 20, 12, 5, side * 0.6, 0, Math.PI * 2);
            g.fill();
          }
      }
  });

/** An abstract print in the palette: arches, a sun, and a horizon, different for each seed. */
export const art = (colors: string[], seed: number) =>
  paint(
    `art${colors.join()}${seed}`,
    256,
    (g, s) => {
      const pick = (i: number) => colors[Math.floor(rand(seed * 13 + i) * colors.length)];
      g.fillStyle = mix(pick(0), "#f4efe6", 0.8);
      g.fillRect(0, 0, s, s);
      const style = seed % 3;
      if (style === 0) {
        for (let i = 0; i < 3; i++) {
          g.fillStyle = pick(i + 1);
          const w = s * (0.5 - i * 0.12);
          g.beginPath();
          g.moveTo(s / 2 - w / 2, s);
          g.lineTo(s / 2 - w / 2, s * 0.55 - i * 10);
          g.arc(s / 2, s * 0.55 - i * 10, w / 2, Math.PI, 0);
          g.lineTo(s / 2 + w / 2, s);
          g.fill();
        }
      } else if (style === 1) {
        g.fillStyle = pick(2);
        g.beginPath();
        g.arc(s * 0.62, s * 0.38, s * 0.16, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = pick(3);
        g.fillRect(0, s * 0.62, s, s * 0.38);
        g.fillStyle = mix(pick(3), "#000000", 0.2);
        g.beginPath();
        g.moveTo(0, s * 0.62);
        g.quadraticCurveTo(s * 0.4, s * 0.45, s, s * 0.62);
        g.fill();
      } else {
        for (let i = 0; i < 6; i++) {
          g.fillStyle = pick(i + 4);
          g.globalAlpha = 0.85;
          g.beginPath();
          g.ellipse(rand(seed + i) * s, rand(seed + i + 20) * s, s * (0.1 + rand(i) * 0.15), s * (0.06 + rand(i + 3) * 0.1), rand(i + 8) * 3, 0, Math.PI * 2);
          g.fill();
        }
        g.globalAlpha = 1;
      }
    },
    false,
  );

/** Rug weaves: a striped kilim for boho, a medallion for classic. */
export const rug = (ground: string, ink: string, kind: "kilim" | "medallion") =>
  paint(
    `rug${ground}${ink}${kind}`,
    256,
    (g, s) => {
      g.fillStyle = ground;
      g.fillRect(0, 0, s, s);
      g.strokeStyle = g.fillStyle = ink;
      g.lineWidth = 6;
      g.strokeRect(10, 10, s - 20, s - 20);
      if (kind === "kilim")
        for (let i = 0; i < 7; i++) {
          const y = 30 + i * 32;
          g.fillStyle = i % 2 ? ink : mix(ink, ground, 0.5);
          for (let x = 24; x < s - 24; x += 24) {
            g.beginPath();
            g.moveTo(x, y + 10);
            g.lineTo(x + 12, y);
            g.lineTo(x + 24, y + 10);
            g.lineTo(x + 12, y + 20);
            g.fill();
          }
        }
      else {
        g.lineWidth = 3;
        g.strokeRect(26, 26, s - 52, s - 52);
        g.beginPath();
        g.ellipse(s / 2, s / 2, s * 0.22, s * 0.16, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = ground;
        g.beginPath();
        g.ellipse(s / 2, s / 2, s * 0.12, s * 0.08, 0, 0, Math.PI * 2);
        g.fill();
      }
    },
    false,
  );
