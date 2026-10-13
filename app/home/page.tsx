import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Reveal } from "@/components/fx/Motion";
import { currentUser } from "@/lib/auth/server";
import { getProfile, projectsOf, type Profile, type ProjectCard } from "@/lib/account/profile";
import { STAGES, stageOf } from "@/lib/project/stage";
import { ROLE_SHORT } from "@/lib/account/roles";
import { NewClient } from "@/components/account/NewClient";
import { Requests } from "@/components/pros/Requests";
import { sitesToday } from "@/lib/site/store";
import { memberProjects } from "@/lib/project/team";
import { PageLoading } from "@/components/fx/PageLoading";
import { Decode } from "@/components/fx/Decode";
import { ROLE_NAME, type ProjectRole } from "@/lib/project/access";

export const metadata: Metadata = { title: "Your projects · Arcon" };

const SPACE: Record<string, string> = { house: "House", apartment: "Apartment", office: "Office", cafe: "Café", hotel: "Hotel", shop: "Shop", studio: "Studio" };
const YOUR: Record<string, string> = { house: "Your house", apartment: "Your home", studio: "Your studio", cafe: "Your café", office: "Your office", shop: "Your shop", hotel: "Your hotel" };

type Card = ProjectCard & { role: ProjectRole; owner?: string | null };

const nameOf = (p: ProjectCard) => p.title ?? [SPACE[p.space_type ?? ""] ?? "Project", p.site?.location && `in ${p.site.location}`].filter(Boolean).join(" ");

function when(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days < 30 ? `${days} days ago` : new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short" });
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** What this person's plan gives them, said plainly: a live plan, the trial days left, or nothing for one-time users. */
function planLine(p: Profile): string | null {
  if (p.role !== "architect" && p.role !== "builder") return null;
  const name = p.role === "architect" ? "Studio" : "Build";
  if ((p.plan === "pro" || p.plan === "build") && p.plan_until && new Date(p.plan_until) > new Date()) return `${name} plan active`;
  const left = p.trial_until ? Math.ceil((new Date(p.trial_until).getTime() - Date.now()) / 86_400_000) : 0;
  return left > 0 ? `${name} trial: ${left} day${left === 1 ? "" : "s"} left` : `Your ${name} trial has ended. Projects are read only until you pick a plan.`;
}

async function HomePageBody() {
  const userId = await currentUser();
  if (!userId) redirect(`/login?next=${encodeURIComponent("/home")}`);
  const profile = await getProfile(userId);
  if (!profile) redirect("/welcome?next=/home");
  const [own, shared] = await Promise.all([projectsOf(userId), memberProjects(userId)]);
  // Every project this person is on, newest first, each with their role on it.
  const projects: Card[] = [...own.map((p) => ({ ...p, role: "owner" as ProjectRole })), ...shared].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const pro = profile.role === "architect" || profile.role === "builder";
  const plan = planLine(profile);
  const tag = (p: Card) => (p.role !== "owner" ? `You're the ${ROLE_NAME[p.role].toLowerCase()}` : pro ? "Your project" : (YOUR[p.space_type ?? ""] ?? "Yours"));
  const stage = (p: Card) => stageOf(p as Parameters<typeof stageOf>[0]);
  const byStage = STAGES.map((s, i) => ({ ...s, n: projects.filter((p) => stage(p) === i).length }));
  // Builders: today on each site that is being built.
  const sites = profile.role === "builder" ? await sitesToday(projects.filter((p) => p.status === "building").map((p) => p.id)) : [];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">
      <Reveal>
        <p className="text-sm text-ink-soft">
          {greeting()}, {profile.name.split(" ")[0]}
          <span className="ml-2 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">{ROLE_SHORT[profile.role]}</span>
          {profile.company && <> · {profile.company}</>}
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-serif text-5xl">
            <Decode text="My projects" />
          </h1>
          <div className="flex gap-2">
            <Link href="/start/plan" className="rounded-full border border-line px-5 py-2.5 text-sm transition hover:border-accent hover:text-accent">
              Upload a plan
            </Link>
            {pro ? (
              <NewClient />
            ) : (
              <Link href="/start" className="glow-btn rounded-full px-5 py-2.5 text-sm">
                + New design
              </Link>
            )}
          </div>
        </div>
      </Reveal>

      {pro && (
        // The pro's tools: their plan, and their projects by stage.
        <Reveal delay={0.05} className="mt-6 rounded-2xl border border-line bg-paper-raised p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{profile.role === "architect" ? "Studio" : "Sites"}</p>
            {plan && <p className="text-sm text-ink-soft">{plan}</p>}
          </div>
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {byStage.map((s) => (
              <li key={s.id} className="rounded-xl bg-paper px-3 py-2">
                <p className="font-serif text-2xl">{s.n}</p>
                <p className="text-xs text-ink-soft">{s.label}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      {sites.length > 0 && (
        <Reveal delay={0.08} className="mt-4 rounded-2xl border border-line bg-paper-raised p-4">
          <p className="text-sm font-medium">Today on site</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {sites.map((s) => {
              const p = projects.find((x) => x.id === s.id)!;
              return (
                <li key={s.id}>
                  <Link href={`/project/${s.id}?tab=site`} className="block rounded-xl bg-paper p-3 transition hover:-translate-y-0.5">
                    <p className="flex justify-between gap-2 text-sm">
                      <span className="font-medium">{nameOf(p)}</span>
                      <span>{s.overall}%</span>
                    </p>
                    <p className="text-xs text-ink-soft">
                      {s.now ?? "Handed over"} · {s.onSite} on site today
                      {s.late > 0 && <span className="text-red-600"> · {s.late} behind</span>}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Reveal>
      )}

      {pro && <Requests />}

      {projects.length === 0 ? (
        <Reveal delay={0.1} className="mt-10 rounded-3xl border border-dashed border-line p-10 text-center">
          <p className="font-serif text-3xl">{pro ? "No clients yet" : "Nothing here yet"}</p>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            {pro
              ? "Add a client: answer Let's get to know you with them, or send them a link. Arcon designs around their taste, and the project lands here."
              : "Answer a few questions about you and your space. Arcon turns your taste into a floor plan, a 3D walkthrough and a budget."}
          </p>
          <div className="mt-6 flex justify-center">
            {pro ? (
              <NewClient />
            ) : (
              <Link href="/start" className="glow-btn inline-block rounded-full px-6 py-3">
                Start your first design
              </Link>
            )}
          </div>
        </Reveal>
      ) : (
        // One-time users get large cards with the progress strip; pros a denser grid.
        <ul className={`mt-8 grid gap-4 ${pro ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"}`}>
          {projects.map((p, i) => {
            const at = stage(p);
            return (
              <li key={p.id}>
                <Reveal delay={0.04 * Math.min(i, 8)}>
                  <Link href={`/project/${p.id}`} className={`group block rounded-2xl border border-line bg-paper-raised transition hover:-translate-y-0.5 hover:border-accent ${pro ? "p-5" : "p-6"}`}>
                    <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-widest text-ink-soft">
                      <span>{SPACE[p.space_type ?? ""] ?? "Project"}</span>
                      <span className="rounded-full border border-line px-2.5 py-0.5 normal-case tracking-normal">{tag(p)}</span>
                    </div>
                    <p className={`mt-3 font-serif leading-tight group-hover:text-accent ${pro ? "text-2xl" : "text-3xl"}`}>{nameOf(p)}</p>
                    {p.owner && p.role !== "owner" && <p className="mt-1 text-sm text-ink-soft">{p.owner.split(" ")[0]}&apos;s design</p>}
                    <ol className="mt-4 grid grid-cols-6 gap-1" aria-label={`Stage: ${STAGES[at].label}`}>
                      {STAGES.map((s, j) => (
                        <li key={s.id} className={`h-1 rounded-full ${j < at ? "bg-leaf" : j === at ? "bg-accent" : "bg-line"}`} />
                      ))}
                    </ol>
                    <p className="mt-3 flex items-center justify-between text-sm text-ink-soft">
                      <span className="text-ink">{STAGES[at].label}</span>
                      <span>
                        {!p.unlocked_at && !pro && p.role === "owner" && <span className="mr-2 rounded-full bg-paper px-2 py-0.5 text-xs">Preview</span>}
                        Updated {when(p.updated_at)}
                      </span>
                    </p>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

// The header shows at once; the part that needs the signed-in user streams in behind it.
export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <Suspense fallback={<PageLoading label="Loading your projects" />}>
        <HomePageBody  />
      </Suspense>
    </div>
  );
}
