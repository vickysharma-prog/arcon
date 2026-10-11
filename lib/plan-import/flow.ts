import type { LanguageModel } from "ai";
import type { Layout, SpaceType } from "../layout/schema.ts";
import { validate } from "../layout/validate.ts";
import { createProject, getProject, updateProject, type Project } from "../project/store.ts";
import { homeBrands, search } from "../qloo/api.ts";
import { buildProfile, layerOf } from "../qloo/taste.ts";
import { planOptionsFor } from "../design/options.ts";
import { programOf, readPlan, type Hints } from "./read.ts";
import { blocking, snapPlan, type ReadPlan } from "./snap.ts";
import { applyEdits, importedOf, rescale, type Edit, type Imported } from "./edits.ts";

export { applyEdits, importedOf, rescale, type Edit, type Imported };

// Bring your own plan: upload, read, check, a few taste questions, then the usual design steps with the
// user's plan first and two other layouts of the same rooms beside it.


/** Upload: a new project for this guest, holding what was read off their plan, waiting for them to check it. */
export async function importPlan(guestId: string, data: Uint8Array, mediaType: string, hints: Hints, model: LanguageModel): Promise<Project> {
  const { read, questions } = await readPlan(data, mediaType, hints, model);
  const { layout, problems, advice } = snapPlan(read);
  const imported: Imported = { read, layout, problems, advice, questions };
  return createProject({
    guest_id: guestId,
    space_type: hints.spaceType,
    title: "Your plan",
    status: "designing",
    site: { width: read.width, depth: read.depth, floors: layout.floors.length, units: hints.units },
    interview: { imported },
  });
}

export type Confirm = { edits: Edit[]; answers?: Record<string, string>; size?: { width: number; depth: number }; loves: string[]; title?: string };

/**
 * Check: apply the user's corrections (and size, if they gave one), build their taste from what they love,
 * and set the plans: theirs first, then two other layouts of the same rooms picked for their taste.
 * Fails with a plain message if the plan still has problems that stop it being modelled.
 */
export async function confirmImport(id: string, c: Confirm): Promise<Project> {
  const p = await getProject(id);
  const imp = importedOf(p.interview);
  if (!imp) throw new Error("This project wasn't started from an uploaded plan.");
  const units = p.site.units ?? "metric";
  const toM = (v: number) => (units === "imperial" ? v * 0.3048 : v);
  let layout = imp.layout;
  let read = imp.read;
  if (c.size && c.size.width > 0 && c.size.depth > 0) {
    read = rescale(read, toM(c.size.width), toM(c.size.depth));
    layout = snapPlan(read).layout;
  }
  layout = applyEdits(layout, c.edits);
  const problems = blocking(validate(layout));
  if (problems.length) throw new Error(`The plan still needs fixing: ${problems.slice(0, 3).join("; ")}`);

  // Their taste, from what they named: places and brands feed style tags, films and music reach home brands.
  const found = (await Promise.all(c.loves.map((n) => n.trim()).filter(Boolean).slice(0, 5).map((n) => search(n, 1)))).map((r) => r[0]).filter(Boolean);
  const signals = found.map((e) => ({ entityId: e.entity_id, name: e.name, layer: layerOf(e), type: e.types?.[0] }));
  const liked = found.filter((e) => layerOf(e) !== 3).map((entity) => ({ entity, layer: layerOf(entity) as 1 | 2 }));
  const taste = buildProfile(liked, await homeBrands(found.filter((e) => layerOf(e) === 3).map((e) => e.entity_id)));

  const own: Layout = { ...layout, concept: { id: "own", name: "Your plan", summary: "The plan you uploaded, as drawn.", why: ["This is your own plan, read from the drawing you uploaded."] } };
  const program = programOf(layout);
  const who = { interview: p.interview, taste, space_type: p.space_type };
  const others = planOptionsFor(program, layout.shell, who).slice(0, 2);
  return updateProject(id, {
    title: c.title?.trim() || p.title,
    site: { ...p.site, width: layout.shell.width, depth: layout.shell.depth, floors: layout.floors.length },
    interview: { ...p.interview, imported: { ...imp, read, layout, problems: [], confirmed: true }, importAnswers: c.answers ?? {} },
    taste_signals: signals,
    taste,
    program,
    options: [own, ...others],
    chosen_option: null,
  });
}
