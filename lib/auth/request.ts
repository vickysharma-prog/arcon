import { getProject, type Project } from "../project/store.ts";
import { roleFor } from "../project/team.ts";
import { can, type Action, type ProjectRole } from "../project/access.ts";
import { GUEST_COOKIE, readCookie, USER_COOKIE, verifyGuest, verifyUser } from "./guest.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const guestOf = (cookieHeader: string | null) =>
  verifyGuest(readCookie(cookieHeader, GUEST_COOKIE), process.env.ARCON_SESSION_SECRET ?? "");

export const userOf = (cookieHeader: string | null) =>
  verifyUser(readCookie(cookieHeader, USER_COOKIE), process.env.ARCON_SESSION_SECRET ?? "");

/** Who sent this request: the signed-in user, the browser's guest id, or both. */
export async function whoOf(cookieHeader: string | null) {
  const [userId, guestId] = await Promise.all([userOf(cookieHeader), guestOf(cookieHeader)]);
  return { userId, guestId };
}

// The project and the sender's role on it, if they may do `action`. Anything else is null, so a stranger
// can't tell a missing project from someone else's, and a viewer can't tell an edit route exists.
export async function accessTo(id: string, cookieHeader: string | null, action: Action = "view"): Promise<{ project: Project; role: ProjectRole } | null> {
  if (!UUID.test(id)) return null;
  const who = await whoOf(cookieHeader);
  if (!who.userId && !who.guestId) return null;
  try {
    const project = await getProject(id);
    const role = await roleFor(project, who);
    return role && can(role, action) ? { project, role } : null;
  } catch {
    return null;
  }
}

/** The project, if the sender may do `action` on it (viewing by default). */
export const ownedProject = async (id: string, cookieHeader: string | null, action: Action = "view") => (await accessTo(id, cookieHeader, action))?.project ?? null;

// What the browser may see: no owner or guest ids.
export const publicProject = ({ owner_id: _o, guest_id: _g, ...rest }: Project) => rest;
