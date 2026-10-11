import { qloo } from "./client.ts";

export type QlooTag = { tag_id?: string; id?: string; name?: string };
export type Entity = {
  entity_id: string;
  name: string;
  types?: string[];
  subtype?: string;
  tags?: QlooTag[];
  popularity?: number;
  properties?: { image?: { url?: string }; geocode?: { city?: string }; address?: string; website?: string };
  query?: { affinity?: number; explainability?: Record<string, { entity_id: string; score: number }[]> };
};

export const tagId = (t: QlooTag) => t.tag_id ?? t.id ?? "";

/** `types`: only these entity types, comma separated (for example "urn:entity:brand"). */
export async function search(query: string, take = 5, types?: string): Promise<Entity[]> {
  const d = await qloo<{ results?: Entity[] }>("/search", { query, take, types });
  return d.results ?? [];
}

export async function insights(params: Record<string, string | number | boolean | undefined>): Promise<Entity[]> {
  const d = await qloo<{ results?: { entities?: Entity[] } }>("/v2/insights", params);
  return d.results?.entities ?? [];
}

const MEDIA = "urn:tag:brand_type:qloo:media_brand";

// Home and design brands matched to a set of liked entities, with why each one was picked.
export async function homeBrands(likedIds: string[], take = 25): Promise<Entity[]> {
  if (!likedIds.length) return [];
  const brands = await insights({
    "filter.type": "urn:entity:brand",
    "filter.tags": "urn:tag:industry:qloo:interior_design",
    "filter.popularity.max": 0.9,
    "signal.interests.entities": likedIds.join(","),
    "feature.explainability": true,
    take,
  });
  return brands.filter((b) => !b.tags?.some((t) => tagId(t) === MEDIA));
}

// Stores near a location, ranked by taste (e.g. furniture stores in "Austin, TX").
export function localStores(likedIds: string[], location: string, categoryTag = "urn:tag:category:place:furniture_store", take = 8) {
  return insights({
    "filter.type": "urn:entity:place",
    "filter.tags": categoryTag,
    "filter.location.query": location,
    "signal.interests.entities": likedIds.join(",") || undefined,
    take,
  });
}

// Taste affinity per geohash in an area, for designing a hotel, café or shop for its neighbourhood.
export async function heatmap(likedIds: string[], location: string) {
  const d = await qloo<{ results?: { heatmap?: { location: { latitude: number; longitude: number; geohash: string }; query: { affinity: number } }[] } }>(
    "/v2/insights",
    { "filter.type": "urn:heatmap", "filter.location.query": location, "signal.interests.entities": likedIds.join(",") },
  );
  return d.results?.heatmap ?? [];
}
