import { NextResponse, type NextRequest } from "next/server";
import { ensureGuest, GUEST_COOKIE, USER_COOKIE, verifyUser } from "./lib/auth/guest.ts";

// Every browser gets a signed guest id on its first visit. The agents only answer requests that carry it.
export async function proxy(request: NextRequest) {
  const secret = process.env.ARCON_SESSION_SECRET ?? "";
  // Someone signed in opens the app, not the landing page: their projects.
  if (request.nextUrl.pathname === "/" && (await verifyUser(request.cookies.get(USER_COOKIE)?.value, secret))) return NextResponse.redirect(new URL("/home", request.url));
  const { set } = await ensureGuest(request.cookies.get(GUEST_COOKIE)?.value, secret);
  const response = NextResponse.next();
  if (set)
    response.cookies.set(GUEST_COOKIE, set, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  return response;
}

export const config = {
  // Pages only: skip Next internals, static files and the agent routes themselves.
  matcher: ["/((?!_next/|eve/|favicon.ico|.*\.[a-z0-9]+$).*)"],
};
