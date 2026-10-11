import type { Layout } from "../layout/schema.ts";

// What a design costs: each room's area times rates by trade, at a quality tier, in the site's market and currency.
// Rates are US mid-tier, in USD, set from published 2025-26 ranges (kitchen and bath remodel totals, flooring and
// paint per square foot, new-build cost per m2) and scaled by market. They are early estimates, not quotes: every
// figure is a low-high range, and the page says so.

export const TIERS = ["essential", "mid", "premium", "luxury"] as const;
export type Tier = (typeof TIERS)[number];
const TIER_FACTOR: Record<Tier, number> = { essential: 0.6, mid: 1, premium: 1.8, luxury: 3 };
export const TIER_NAMES: Record<Tier, string> = { essential: "Essential", mid: "Mid-range", premium: "Premium", luxury: "Luxury" };

export type Category = "construction" | "finishes" | "electrical" | "kitchen" | "bath" | "furniture" | "plants" | "fees";
export const CATEGORY_NAMES: Record<Category, string> = {
  construction: "Construction",
  finishes: "Floors, walls and ceilings",
  electrical: "Electrical and lighting",
  kitchen: "Kitchen",
  bath: "Bathrooms",
  furniture: "Furniture and decor",
  plants: "Plants",
  fees: "Design and contingency",
};

// US, mid tier, USD.
const PER_M2 = { construction: 2700, finishes: 110, electrical: 45 };
const KITCHEN = { home: 28000, business: 60000 }; // a commercial kitchen has extraction, steel and gas safety
const BATH = { full: 15000, half: 7000 };
const PLANT = 120; // per lived-in room
const FEES = 0.1;
// Furniture and decor per m2, by room kind.
const FURNITURE: Record<string, number> = {
  living: 250, lounge: 250, bedroom: 200, "guest-room": 350, dining: 220, office: 180, workspace: 300, meeting: 350,
  reception: 400, counter: 600, retail: 250, fitting: 150, kitchen: 0, bath: 0, laundry: 40, storage: 40, closet: 120, pantry: 60,
};
const NO_PLANTS = new Set(["bath", "storage", "closet", "laundry", "pantry", "corridor", "stairs", "void"]);

/** A market: its currency, and what work costs there next to the US (interiors and building differ). */
export type Market = { id: string; name: string; currency: string; locale: string; fx: number; interiors: number; build: number };
// fx: local currency per USD, approximate as of October 2026.
export const MARKETS: Market[] = [
  { id: "us", name: "United States", currency: "USD", locale: "en-US", fx: 1, interiors: 1, build: 1 },
  { id: "ca", name: "Canada", currency: "CAD", locale: "en-CA", fx: 1.37, interiors: 0.95, build: 1.05 },
  { id: "uk", name: "United Kingdom", currency: "GBP", locale: "en-GB", fx: 0.76, interiors: 1.05, build: 1.3 },
  { id: "de", name: "Germany", currency: "EUR", locale: "de-DE", fx: 0.88, interiors: 1.05, build: 1.2 },
  { id: "au", name: "Australia", currency: "AUD", locale: "en-AU", fx: 1.52, interiors: 0.95, build: 0.95 },
  { id: "ae", name: "United Arab Emirates", currency: "AED", locale: "en-AE", fx: 3.67, interiors: 0.75, build: 0.9 },
  { id: "sg", name: "Singapore", currency: "SGD", locale: "en-SG", fx: 1.3, interiors: 1, build: 1.1 },
  { id: "in", name: "India", currency: "INR", locale: "en-IN", fx: 88, interiors: 0.22, build: 0.1 },
];

const PLACES: [RegExp, string][] = [
  [/india|mumbai|delhi|bengaluru|bangalore|pune|hyderabad|chennai|kolkata|noida|gurgaon|gurugram|jaipur|ahmedabad|lucknow|chandigarh|kochi|goa|indore|surat/i, "in"],
  [/\b(uk|united kingdom|england|scotland|wales)\b|london|manchester|birmingham|edinburgh|glasgow|bristol|leeds|liverpool/i, "uk"],
  [/canada|toronto|vancouver|montreal|calgary|ottawa|edmonton/i, "ca"],
  [/australia|sydney|melbourne|brisbane|perth|adelaide|canberra/i, "au"],
  [/\b(uae)\b|emirates|dubai|abu dhabi|sharjah/i, "ae"],
  [/singapore/i, "sg"],
  [/germany|deutschland|berlin|munich|münchen|hamburg|frankfurt|cologne|köln|stuttgart|düsseldorf/i, "de"],
];

/** Whether we have costs for this place: a market we know, or the US (a state code like "Austin, TX" or "USA"). */
export const knownMarket = (location: string | null | undefined) =>
  !location || PLACES.some(([re]) => re.test(location)) || /\b(usa?|united states)\b|,\s*[A-Z]{2}\b|\b\d{5}\b/i.test(location);

/** The market a site is in, from its location text. Anywhere else uses US costs, and says so. */
export function marketOf(location: string | null | undefined): Market {
  const id = PLACES.find(([re]) => re.test(location ?? ""))?.[1] ?? "us";
  return MARKETS.find((m) => m.id === id)!;
}

export type Range = { low: number; high: number };
export type Line = { category: Category; amount: number };
export type RoomCost = { id: string; name: string; kind: string; area: number; lines: Line[]; total: number };
export type Estimate = { tier: Tier; market: Market; rooms: RoomCost[]; byCategory: Partial<Record<Category, number>>; total: Range; area: number };

// The range around a point estimate: early estimates run about 20% under to 25% over.
const spread = (v: number): Range => ({ low: v * 0.8, high: v * 1.25 });

/** The estimate for a layout. `newBuild` adds the building itself; businesses get commercial kitchens. */
export function estimate(layout: Layout, tier: Tier, market: Market, newBuild = false): Estimate {
  const t = TIER_FACTOR[tier];
  const inside = market.interiors * market.fx * t;
  const home = ["house", "apartment", "studio"].includes(layout.spaceType);
  const rooms: RoomCost[] = [];
  for (const f of layout.floors)
    for (const s of f.spaces.filter((x) => x.kind !== "void")) {
      const area = s.rect.w * s.rect.h;
      const lines: Line[] = [
        { category: "finishes", amount: area * PER_M2.finishes * inside },
        { category: "electrical", amount: area * PER_M2.electrical * inside },
      ];
      if (s.kind === "kitchen") lines.push({ category: "kitchen", amount: (home ? KITCHEN.home : KITCHEN.business) * inside });
      if (s.kind === "bath") lines.push({ category: "bath", amount: (/powder|wc|restroom|toilet/i.test(s.name) ? BATH.half : BATH.full) * inside });
      const furniture = FURNITURE[s.kind] ?? 0;
      if (furniture) lines.push({ category: "furniture", amount: area * furniture * inside });
      if (s.zone !== "circulation" && !NO_PLANTS.has(s.kind)) lines.push({ category: "plants", amount: PLANT * inside });
      rooms.push({ id: s.id, name: s.zone === "circulation" ? s.name || "Halls" : s.name, kind: s.kind, area, lines, total: lines.reduce((a, l) => a + l.amount, 0) });
    }
  const area = rooms.reduce((a, r) => a + r.area, 0);
  const byCategory: Partial<Record<Category, number>> = {};
  for (const r of rooms) for (const l of r.lines) byCategory[l.category] = (byCategory[l.category] ?? 0) + l.amount;
  // The building itself is costed on the whole floor area; quality moves it less than it moves interiors.
  if (newBuild) byCategory.construction = area * PER_M2.construction * market.build * market.fx * Math.sqrt(t);
  const sub = Object.values(byCategory).reduce((a, v) => a + v, 0);
  byCategory.fees = sub * FEES;
  return { tier, market, rooms, byCategory, total: spread(sub * (1 + FEES)), area };
}

/** "₹18.4L–28.7L", "$84k–132k": rounded, in the market's own way of writing money. */
export function money(v: number, m: Market): string {
  return new Intl.NumberFormat(m.locale, { style: "currency", currency: m.currency, notation: "compact", maximumFractionDigits: 1 }).format(v);
}
