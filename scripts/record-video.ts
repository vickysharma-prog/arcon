// Records the 30-second film: a real run of the app from every side (homeowner, business, architect, client,
// builder), one short beat each, with a caption naming whose view it is. Each beat is recorded only once its page is
// on screen; the beats are joined into one MP4.
// Run with the app on localhost:3000 (npx next build && npx next start -p 3000):
//   FFMPEG_PATH=<ffmpeg.exe> node --env-file=.env.local --env-file=.env scripts/record-video.ts <designId> <builtId> <clientId> <out.mp4>
// designId: the test owner's house, unlocked, still in design. builtId: the test owner's house, built and moved in.
// clientId: a project the test client is on, with an approved design. The film shows Qloo images, so it never goes in
// the repo: it's uploaded to storage (scripts/upload-video.ts).
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";
import { signUser } from "../lib/auth/guest.ts";

const [designId, builtId, clientId, out = "arcon-30s.mp4"] = process.argv.slice(2);
if (!designId || !builtId || !clientId) throw new Error("usage: record-video.ts <designId> <builtId> <clientId> <out.mp4>");
const BASE = "http://localhost:3000";
const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const parts = join(dirname(out), "scenes");
rmSync(parts, { recursive: true, force: true });
mkdirSync(parts, { recursive: true });

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const { data } = await db.auth.admin.listUsers({ perPage: 200 });
const sessions: Record<string, string> = {};
for (const role of ["owner", "business", "architect", "builder", "client"]) {
  const u = data.users.find((x) => x.email === `arcon.test.${role}@example.com`);
  if (!u) throw new Error(`no test ${role}`);
  sessions[role] = await signUser(u.id, process.env.ARCON_SESSION_SECRET!);
}

// the graphics card draws the 3D (software drawing makes the walkthrough crawl)
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--force-color-profile=srgb", "--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-size=1280,720"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
const wait = (s: number) => new Promise((r) => setTimeout(r, s * 1000));
async function as(role: string | null) {
  await page.deleteCookie({ name: "arcon_user", domain: "localhost" });
  if (role) await page.setCookie({ name: "arcon_user", value: sessions[role], domain: "localhost", path: "/" });
}

/** Open a page and wait until `text` is on screen, plus a moment for it to settle. */
async function open(path: string, text: string, settle = 1) {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    try {
      localStorage.setItem("arcon_cookie_notice", "seen");
    } catch {}
  });
  await page.waitForFunction((t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()), { timeout: 90_000 }, text);
  await wait(settle);
}

/** A caption at the bottom of the frame: whose view it is, and what it shows. */
async function caption(who: string, text: string) {
  await page.evaluate(
    (w, t) => {
      let el = document.getElementById("film-caption");
      if (!el) {
        el = document.createElement("div");
        el.id = "film-caption";
        el.setAttribute("style", "position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:2147483647;display:flex;gap:12px;align-items:center;padding:11px 22px;border-radius:999px;background:rgba(10,14,24,.88);color:#fff;font:500 21px/1.3 ui-sans-serif,system-ui,sans-serif;box-shadow:0 18px 50px -20px rgba(59,130,246,.8);white-space:nowrap");
        document.body.appendChild(el);
      }
      el.innerHTML = "";
      if (w) {
        const tag = document.createElement("span");
        tag.textContent = w;
        tag.setAttribute("style", "font:600 12px/1 ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:#93c5fd;border:1px solid rgba(147,197,253,.5);border-radius:999px;padding:5px 9px");
        el.appendChild(tag);
      }
      el.appendChild(document.createTextNode(t));
    },
    who,
    text,
  );
}

const scenes: string[] = [];
async function beat(name: string, act: () => Promise<void>) {
  const file = join(parts, `${String(scenes.length).padStart(2, "0")}-${name}.webm`) as `${string}.webm`;
  const rec = await page.screencast({ path: file, ffmpegPath: FFMPEG, fps: 30 });
  await act();
  await rec.stop();
  scenes.push(file);
}
const clickText = async (label: string) => {
  for (const b of await page.$$("button")) if ((await b.evaluate((e) => e.textContent?.trim() ?? "")) === label) return void (await b.click());
};

// 1. the opening
await as(null);
await open("/", "spaces designed");
await page.evaluate(() => sessionStorage.removeItem("arcon-intro"));
await page.goto(BASE + "/", { waitUntil: "networkidle2" });
await wait(0.8);
await beat("opening", async () => {
  await page.mouse.click(640, 360);
  await wait(2.4);
  await caption("", "Your AI architect, powered by Qloo's taste AI");
  await wait(1);
});

// 2. homeowner: three picks, and the style
await open("/quiz", "find my style");
await clickText("Find my style");
await page.waitForSelector("main li button img", { timeout: 60_000 });
await wait(1.2);
await beat("taste", async () => {
  await caption("Homeowner", "Three things you love. Qloo reads your style.");
  for (let round = 0; round < 3; round++) {
    await wait(0.55);
    const tiles = await page.$$("main li button");
    await tiles[[1, 2, 0][round]]?.click();
  }
  await page.waitForFunction(() => !document.body.innerText.toLowerCase().includes("reading your taste"), { timeout: 60_000 });
  await wait(1.3);
});

// 3. homeowner: three plans
await as("owner");
await open(`/project/${designId}?step=plans`, "option 3", 1.2);
await beat("plans", async () => {
  await caption("Homeowner", "Three plans, each honest about its trade-offs");
  await page.mouse.wheel({ deltaY: 200 });
  await wait(2.4);
});

// 4. homeowner: the 3D
await open(`/project/${designId}?step=walkthrough`, "walk", 5);
await page.evaluate(() => document.querySelector("canvas")?.scrollIntoView({ block: "center" }));
await wait(1.2);
await beat("walk", async () => {
  await caption("Homeowner", "Walk through it in 3D, by day or by night");
  await clickText("Walk through");
  await wait(3);
});

// 5. homeowner: a change by chat, priced
await open(`/project/${designId}?step=workspace`, "make it yours", 2.5);
await beat("change", async () => {
  await caption("Homeowner", "Change anything by chat; the price follows");
  const box = await page.$('input[aria-label="What to change"]');
  await box?.click();
  await box?.type("make the living room bigger", { delay: 28 });
  await page.keyboard.press("Enter");
  await wait(2);
});

// 6. business: their café, the crowd and the opening day
await as("business");
await open("/home", "opening", 2);
await beat("business", async () => {
  await caption("Café owner", "Plans for your crowd, a countdown to opening day");
  await wait(2.8);
});

// 7. architect: the studio
await as("architect");
await open("/home?view=pipeline", "pipeline", 2);
await beat("architect", async () => {
  await caption("Architect", "Every client by stage, fees by milestone");
  await wait(2.8);
});

// 8. client: approvals on record
await as("client");
await open(`/project/${clientId}?tab=thread`, "approved", 1.5);
await beat("client", async () => {
  await caption("Client", "Approve the design, and every change, in the thread");
  await wait(2.8);
});

// 9. builder: the sites
await as("builder");
await open("/home?view=today", "today on site", 2);
await beat("builder", async () => {
  await caption("Builder", "Phases, crew, materials; paid by stage");
  await wait(2.8);
});

// 10. moving in
await as("owner");
await open(`/project/${builtId}?tab=site`, "handed over", 1.2);
await beat("movein", async () => {
  await caption("Everyone", "Snags, handover, warranty, reviews. Moved in.");
  await wait(2.6);
});

// 11. the end card
await as(null);
await page.evaluate(() => sessionStorage.setItem("arcon-intro", "1"));
await open("/", "spaces designed", 1);
await beat("end", async () => {
  await caption("", "Arcon · try it free at arcon-ten.vercel.app");
  await wait(2);
});
await browser.close();

// join the beats into one MP4 that plays everywhere
const list = join(parts, "list.txt");
writeFileSync(list, scenes.map((f) => `file '${f.replaceAll("\\", "/")}'`).join("\n"));
execFileSync(FFMPEG, ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "22", "-r", "30", "-movflags", "+faststart", "-an", out]);
console.log("wrote", out, scenes.length, "beats");
