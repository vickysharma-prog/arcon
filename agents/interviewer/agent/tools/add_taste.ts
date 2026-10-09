import { defineTool } from "eve/tools";
import { z } from "zod";
import { homeBrands } from "../../../../lib/qloo/api.ts";
import { buildProfile, layerOf } from "../../../../lib/qloo/taste.ts";
import { addTasteSignals, updateProject } from "../../../../lib/project/store.ts";
import { profileSummary } from "../../../../lib/interview/logic.ts";
import { candidates, sessionProject } from "../lib/session.ts";

export default defineTool({
  description:
    "Add confirmed matches from find_taste to the user's taste, then rebuild their style profile. Returns the strongest style words with what they came from, and matching home brands, so you can reflect the style back in plain words.",
  inputSchema: z.object({ entityIds: z.array(z.string()).min(1).describe("entityId values from find_taste") }),
  label: { start: () => "Updating your taste profile" },
  async execute({ entityIds }, ctx) {
    const known = candidates.get();
    const unknown = entityIds.filter((id) => !known[id]);
    if (unknown.length) throw new Error(`Call find_taste first; these ids weren't found in this conversation: ${unknown.join(", ")}`);

    const p = await sessionProject(ctx);
    const added = entityIds.map((id) => known[id]);
    const updated = await addTasteSignals(
      p.id,
      added.map((e) => ({ entityId: e.entity_id, name: e.name, layer: layerOf(e), type: e.types?.[0] })),
    );

    // Places and brands feed their own tags; culture reaches home brands through Qloo insights.
    const liked = updated.taste_signals
      .filter((s) => s.layer !== 3 && known[s.entityId])
      .map((s) => ({ entity: known[s.entityId], layer: s.layer as 1 | 2 }));
    const culture = updated.taste_signals.filter((s) => s.layer === 3).map((s) => s.entityId);
    const profile = buildProfile(liked, await homeBrands(culture));
    await updateProject(p.id, { taste: profile });
    return { tasteCount: updated.taste_signals.length, ...profileSummary(profile) };
  },
});
