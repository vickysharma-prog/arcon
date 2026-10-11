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
const SERVICE = "urn:tag:brand_type:qloo:service_brand";
// ponytail: a name check for clothing labels Qloo files under home goods; a product_service check if more slip through.
const CLOTHING = /swimwear|apparel|clothing|lingerie|fashion/i;

/** A brand you could furnish a home from: not a magazine, an app or design firm, or a clothing label. */
export const isHomeBrand = (b: Entity) => !b.tags?.some((t) => [MEDIA, SERVICE].includes(tagId(t))) && !CLOTHING.test(b.name);

/** Entities by id, in one call (their images, tags and properties). */
export async function entitiesById(ids: string[]): Promise<Entity[]> {
  if (!ids.length) return [];
  const d = await qloo<{ results?: Entity[] }>("/entities", { entity_ids: ids.join(",") });
  return d.results ?? [];
}

/** Places with a photo that share these decor tags and suit this taste: hotels, cafés and bars that look the part. */
export async function kindredPlaces(likedIds: string[], decorTags: string[], take = 6): Promise<Entity[]> {
  if (!likedIds.length || !decorTags.length) return [];
  return insights({
    "filter.type": "urn:entity:place",
    "filter.tags": decorTags.join(","),
    "filter.exists": "properties.image",
    "signal.interests.entities": likedIds.join(","),
    take,
  });
}

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
  return brands.filter(isHomeBrand);
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
