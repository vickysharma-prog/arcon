import { getProject, ownsProject, type Project } from "../project/store.ts";
import { GUEST_COOKIE, readCookie, verifyGuest } from "./guest.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const guestOf = (cookieHeader: string | null) =>
  verifyGuest(readCookie(cookieHeader, GUEST_COOKIE), process.env.ARCON_SESSION_SECRET ?? "");

// The project, if it exists and belongs to whoever sent this request. Anything else is null,
// so a stranger can't tell a missing project from someone else's.
export async function ownedProject(id: string, cookieHeader: string | null): Promise<Project | null> {
  if (!UUID.test(id)) return null;
  const guestId = await guestOf(cookieHeader);
  if (!guestId) return null;
  try {
    const p = await getProject(id);
    return ownsProject(p, { guestId }) ? p : null;
  } catch {
    return null;
  }
}

// What the browser may see: no owner or guest ids.
export const publicProject = ({ owner_id: _o, guest_id: _g, ...rest }: Project) => rest;
