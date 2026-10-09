import type { Role } from "./furniture.ts";

// Colours for the 3D model, taken from the design brief's palette so the model looks like the brief.
type Swatch = { hex: string; role: string };

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c: number[]) => "#" + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
export const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const mix = (a: string, b: string, t: number) => toHex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));

export type Scheme = { wall: string; floor: string; bathFloor: string; exterior: string; roof: string; ground: string } & Record<Role, string>;

const FALLBACK: Scheme = {
  wall: "#f2efe9", floor: "#a07850", bathFloor: "#d9d6d0", exterior: "#e9e5dd", roof: "#3c4048", ground: "#7da36a",
  wood: "#a07850", textile: "#c9b8a3", metal: "#8a8f96", accent: "#3a6ea5", base: "#e4e1db", plant: "#4f7a4a", pot: "#b9a48a",
};

export function scheme(palette: Swatch[] | undefined): Scheme {
  if (!palette?.length) return FALLBACK;
  const by = (role: string) => palette.find((c) => c.role === role)?.hex;
  const lightest = [...palette].sort((a, b) => luminance(b.hex) - luminance(a.hex))[0].hex;
  const darkest = [...palette].sort((a, b) => luminance(a.hex) - luminance(b.hex))[0].hex;
  // Walls are the palette's lightest colour, pushed toward white so rooms stay bright.
  const wall = mix(lightest, "#ffffff", luminance(lightest) > 0.8 ? 0.2 : 0.65);
  const wood = by("wood") ?? FALLBACK.wood;
  return {
    wall,
    floor: wood,
    bathFloor: mix(by("base") ?? lightest, "#ffffff", 0.5),
    exterior: mix(by("base") ?? lightest, "#ffffff", 0.35),
    roof: mix(darkest, "#000000", 0.1),
    ground: FALLBACK.ground,
    wood,
    textile: by("textile") ?? mix(lightest, wood, 0.35),
    metal: by("metal") ?? FALLBACK.metal,
    accent: by("accent") ?? FALLBACK.accent,
    base: mix(by("base") ?? lightest, "#ffffff", 0.3),
    plant: by("green") ?? FALLBACK.plant,
    pot: mix(wood, "#ffffff", 0.35),
  };
}
