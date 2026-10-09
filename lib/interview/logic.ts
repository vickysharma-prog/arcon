import type { Entity } from "../qloo/api.ts";
import { layerOf, type Profile } from "../qloo/taste.ts";
import type { Project } from "../project/store.ts";

const FT = 0.3048;
export const toMetres = (value: number, unit: "ft" | "m") => (unit === "ft" ? value * FT : value);

const KIND: Record<string, string> = {
  "urn:entity:movie": "film",
  "urn:entity:tv_show": "TV show",
  "urn:entity:artist": "music",
  "urn:entity:book": "book",
  "urn:entity:podcast": "podcast",
  "urn:entity:video_game": "game",
  "urn:entity:place": "place",
  "urn:entity:destination": "destination",
  "urn:entity:brand": "brand",
  "urn:entity:person": "person",
};

// Sides from 6 m (a small studio) to 180 m (a large hotel). Anything else is almost certainly a typo.
export function siteSizeProblem(width: number | undefined, depth: number | undefined, unit: "ft" | "m"): string | null {
  for (const [name, v] of [["width", width], ["depth", depth]] as const) {
    if (v === undefined) continue;
    const m = toMetres(v, unit);
    if (m < 6 || m > 180) return `A ${name} of ${v} ${unit} is outside 6 to 180 metres (20 to 590 feet). Ask the user to check it.`;
  }
  return null;
}

export type Candidate = { entityId: string; name: string; kind: string; detail: string; layer: 1 | 2 | 3 };

// A short, human description of a Qloo match, so the user can tell two "Ace Hotel"s apart.
export function toCandidate(e: Entity): Candidate {
  const type = e.types?.find((t) => KIND[t]) ?? "";
  const p = e.properties ?? {};
  const detail = p.address ?? p.geocode?.city ?? "";
  return { entityId: e.entity_id, name: e.name, kind: KIND[type] ?? "other", detail, layer: layerOf(e) };
}

export const MIN_TASTE = 3;

// What the interview still needs before design can start. Empty means ready.
export function missingForDesign(p: Project): string[] {
  const missing: string[] = [];
  if (!p.space_type) missing.push("what kind of space we are designing");
  if (!p.site.width || !p.site.depth) missing.push("the width and depth of the plot or floor");
  if (!p.site.location) missing.push("the city or ZIP code");
  if (p.taste_signals.length < MIN_TASTE) missing.push(`at least ${MIN_TASTE} things they love: places, brands, films or music`);
  if (!p.taste_signals.some((s) => s.layer === 1 || s.layer === 2)) missing.push("at least one place or brand they love");
  return missing;
}

// The part of a profile the interviewer reflects back to the user.
export function profileSummary(profile: Profile, words = 8, brands = 5) {
  return {
    style: profile.tags.slice(0, words).map((t) => ({ word: t.value.replaceAll("_", " "), from: t.sources.map((s) => s.name) })),
    brands: profile.brands.slice(0, brands).map((b) => ({ name: b.name, look: b.aesthetic.slice(0, 3).map((a) => a.replaceAll("_", " ")) })),
  };
}
