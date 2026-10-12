import { requireUser } from "@/lib/auth/user";
import { acceptInvite } from "@/lib/project/team";

// Accept an invite link. Needs a signed-in account, so everyone on a project is a real person.
export async function POST(request: Request, ctx: RouteContext<"/api/join/[token]">) {
  const who = await requireUser(request);
  if ("error" in who) return who.error;
  const result = await acceptInvite((await ctx.params).token, who.userId);
  return "error" in result ? Response.json(result, { status: 410 }) : Response.json(result);
}
