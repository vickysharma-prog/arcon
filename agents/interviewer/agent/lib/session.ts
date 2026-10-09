import { defineState } from "eve/context";
import type { Entity } from "../../../../lib/qloo/api.ts";
import { bindSession, createProject, projectForSession, type Project } from "../../../../lib/project/store.ts";

// Qloo entities found during this conversation, by id, so add_taste can use their full tags.
export const candidates = defineState<Record<string, Entity>>("interviewer.candidates", () => ({}));

// The project this session works on. The web app binds it when the session starts;
// a session started without one (for example from the terminal) gets a fresh project.
export async function sessionProject(sessionId: string): Promise<Project> {
  try {
    return await projectForSession(sessionId);
  } catch {
    const p = await createProject({});
    await bindSession(sessionId, p.id, "interviewer");
    return p;
  }
}
