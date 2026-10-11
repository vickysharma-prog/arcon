import { ownedProject } from "@/lib/auth/request";
import { ecoFor } from "@/lib/green/eco";

// Eco brands from their taste and plant nurseries near the site, from Qloo (cached).
export async function GET(request: Request, ctx: RouteContext<"/api/projects/[id]/green">) {
  const p = await ownedProject((await ctx.params).id, request.headers.get("cookie"));
  if (!p) return Response.json({ error: "not found" }, { status: 404 });
  try {
    return Response.json(await ecoFor(p));
  } catch {
    return Response.json({ brands: [], nurseries: [] });
  }
}
