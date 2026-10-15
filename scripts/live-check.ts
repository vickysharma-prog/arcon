// Checks the live site after a deploy, as the test accounts Vicky approved, from here (never in her browser).
// Run: node --env-file=.env.local --env-file=.env scripts/live-check.ts [base url]
// Prints one line per check and exits 1 if any fail. Uses the test projects in Supabase (see state.md).
import { createClient } from "@supabase/supabase-js";
import { signUser } from "../lib/auth/guest.ts";

const BASE = process.argv[2] ?? "https://arcon-ten.vercel.app";
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const { data } = await db.auth.admin.listUsers({ perPage: 200 });
const cookieFor = async (role: string) => {
  const u = data.users.find((x) => x.email === `arcon.test.${role}@example.com`);
  if (!u) throw new Error(`no test ${role}`);
  return `arcon_user=${await signUser(u.id, process.env.ARCON_SESSION_SECRET!)}`;
};

// The test projects: a house being built (owner, client, builder), a café and a self-build house (owner).
const BUILDING = "2ec977ae-e718-430e-89a9-44afeff12b4e";
const CAFE = "6aa147ed-2d22-4cd9-b093-9e76b912a4ce";
const SELF = "2418b263-5bff-43b4-a762-2f5d76e22ac2";

let failed = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
};
const get = async (path: string, role?: string) => {
  const res = await fetch(BASE + path, { headers: role ? { cookie: await cookieFor(role) } : {} });
  const type = res.headers.get("content-type") ?? "";
  return { status: res.status, body: type.includes("json") ? await res.json() : await res.text() };
};

// Pages
for (const p of ["/", "/login"]) {
  const r = await get(p);
  check(`page ${p}`, r.status === 200, String(r.status));
}
const home = await get("/home", "builder");
check("builder's home loads", home.status === 200 && String(home.body).includes("Today on site"));

// The site: the builder sees the costs, the client the budget only (15 Oct)
const asBuilder = await get(`/api/projects/${BUILDING}/site`, "builder");
check("site as builder", asBuilder.status === 200 && asBuilder.body.runs === true && typeof asBuilder.body.site?.money?.spent === "number", `spent ${asBuilder.body.site?.money?.spent}`);
const asClient = await get(`/api/projects/${BUILDING}/site`, "client");
const leaked = JSON.stringify(asClient.body.site ?? {}).match(/day_rate|unit_cost|"cost"|spent|labour/);
check("site as client hides the builder's costs", asClient.status === 200 && asClient.body.runs === false && !leaked, leaked ? `leaks ${leaked[0]}` : "budget only");
check("client can't change the site", (await fetch(`${BASE}/api/projects/${BUILDING}/site`, { method: "POST", headers: { cookie: await cookieFor("client"), "content-type": "application/json" }, body: JSON.stringify({ op: "material.add", name: "x", unit: "u", needed: 1 }) })).status === 403);

// The steps to get building, and an owner managing the build (14 Oct)
const self = await get(`/api/projects/${SELF}/site`, "owner");
check("site steps for the owner", self.status === 200 && !!self.body.steps, JSON.stringify(self.body.steps ?? {}));

// The neighbourhood read (15 Oct): real cafés only, one per chain
const n = await get(`/api/projects/${CAFE}/neighbourhood?crowd=all`, "owner");
const places: { name: string }[] = n.body.read?.places ?? [];
check("neighbourhood read", n.status === 200 && places.length >= 3, `${places.length} places`);
const stems = places.map((p) => p.name.toLowerCase().split(/\s+/)[0]);
check("one place per chain", new Set(stems).size === stems.length, stems.join(", "));
const young = await get(`/api/projects/${CAFE}/neighbourhood?crowd=young`, "owner");
check("crowd switch", young.status === 200 && (young.body.read?.places ?? []).length >= 3);

// The drawings pack (15 Oct) is drawn in the browser: check the live bundle for the page carries it.
const page = await get(`/project/${CAFE}`, "owner");
const scripts = [...String(page.body).matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]);
const bundle = (await Promise.all(scripts.map(async (s) => (await fetch(BASE + s)).text()))).join(" ");
const drawings = bundle.includes("Door and window schedule");
check("project page loads", page.status === 200, `${scripts.length} scripts`);
check("drawings pack in the live bundle", drawings);
// The exterior from taste and day and night (16 Oct)
check("exterior from taste in the live bundle", bundle.includes("a pitched gable roof") && bundle.includes("a planted garden"));
check("day and night in the live bundle", bundle.includes("#0d1424"));

console.log(failed ? `${failed} failed` : "all live checks passed");
process.exit(failed ? 1 : 0);
