import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SiteHeader } from "@/components/SiteHeader";
import { Reveal } from "@/components/fx/Motion";
import { currentUser } from "@/lib/auth/server";
import { getProfile, projectsOf, type Profile, type ProjectCard } from "@/lib/account/profile";
import { STAGES, nextLine, stageOf } from "@/lib/project/stage";
import { ROLE_SHORT } from "@/lib/account/roles";
import { NewClient } from "@/components/account/NewClient";
import { DeleteProject } from "@/components/project/DeleteProject";
import { Requests } from "@/components/pros/Requests";
import { dayIn } from "@/lib/site/plan";
import { memberProjects } from "@/lib/project/team";
import { PageLoading } from "@/components/fx/PageLoading";
import { Decode } from "@/components/fx/Decode";
import { ROLE_NAME, type ProjectRole } from "@/lib/project/access";
import { boardFor, type Board } from "@/lib/home/board";
import { statusLine, type Wait } from "@/lib/home/waiting";
import { projectName, SPACE } from "@/lib/home/names";
import { PlanSketch } from "@/components/home/PlanSketch";
import { OpeningDay, PlanOr3D } from "@/components/home/Focus";

export const metadata: Metadata = { title: "Your projects · Arcon" };

// The signed-in home. One page, laid out for who it is: "My house" or "My space" puts one project in focus with its
// plan, what's next and where it stands; "Studio" lays an architect's clients out by stage; "Sites" puts a builder's
// day first. All of them open with a status line and what's waiting on this person.

const YOUR: Record<string, string> = { house: "Your house", apartment: "Your home", studio: "Your studio", cafe: "Your café", office: "Your office", shop: "Your shop", hotel: "Your hotel" };
const BUSINESS = ["cafe", "office", "shop", "hotel"];
const TITLE = { owner: "My house", business: "My space", architect: "Studio", builder: "Sites" } as const;

type Card = ProjectCard & { role: ProjectRole; owner?: string | null };

function when(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days < 30 ? `${days} days ago` : new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
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

const stage = (p: Card) => stageOf(p as Parameters<typeof stageOf>[0]);

async function HomePageBody() {
  const userId = await currentUser();
  if (!userId) redirect(`/login?next=${encodeURIComponent("/home")}`);
  const profile = await getProfile(userId);
  if (!profile) redirect("/welcome?next=/home");
  const [own, shared] = await Promise.all([projectsOf(userId), memberProjects(userId)]);
  // Every project this person is on, newest first, each with their role on it.
  const projects: Card[] = [...own.map((p) => ({ ...p, role: "owner" as ProjectRole })), ...shared].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const board = await boardFor(
    userId,
    projects.map((p) => ({ id: p.id, name: projectName(p), role: p.role, mode: p.mode, status: p.status, chosen_option: p.chosen_option, space_type: p.space_type, site: p.site })),
    dayIn((await cookies()).get("arcon_tz")?.value),
  );
  const role = profile.role;
  const pro = role === "architect" || role === "builder";
  const plan = planLine(profile);
  const line = statusLine(projects.map((p) => STAGES[stage(p)].label), board.waits.length);

  return (
    <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">
      {/* a faint blueprint grid behind the top of the page */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 opacity-[0.06] [background-image:linear-gradient(var(--accent)_1px,transparent_1px),linear-gradient(90deg,var(--accent)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Reveal>
        <p className="text-sm text-ink-soft">
          {greeting()}, {profile.name.split(" ")[0]}
          <span className="ml-2 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">{ROLE_SHORT[role]}</span>
          {profile.company && <> · {profile.company}</>}
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-serif text-5xl sm:text-6xl">
            <Decode text={TITLE[role]} />
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
        <p className="mt-3 font-mono text-xs text-ink-soft">
          <span className="text-accent">&gt; </span>
          <Decode text={line} delay={0.4} speed={14} />
          {plan && <span className="ml-2 text-accent">· {plan}</span>}
        </p>
      </Reveal>

      {projects.length > 0 && <Waiting waits={board.waits} />}

      {projects.length === 0 ? (
        <Empty pro={pro} />
      ) : role === "architect" ? (
        <StudioBoard projects={projects} board={board} />
      ) : role === "builder" ? (
        <SitesBoard projects={projects} board={board} />
      ) : (
        <OwnerBoard projects={projects} board={board} business={role === "business"} />
      )}

      {pro && <Requests />}
    </main>
  );
}

// What's waiting on this person, most urgent first.
const KIND: Record<Wait["kind"], { mark: string; tone: string }> = {
  review: { mark: "Review", tone: "text-accent border-accent/40 bg-accent/5" },
  changes: { mark: "Changes", tone: "text-amber-600 border-amber-500/40 bg-amber-500/5" },
  pay: { mark: "Pay", tone: "text-accent border-accent/40 bg-accent/5" },
  confirm: { mark: "Confirm", tone: "text-leaf border-leaf/40 bg-leaf/5" },
  late: { mark: "Behind", tone: "text-red-600 border-red-500/40 bg-red-500/5" },
  choose: { mark: "Choose", tone: "text-accent border-accent/40 bg-accent/5" },
  messages: { mark: "Thread", tone: "text-ink-soft border-line bg-paper" },
};

function Waiting({ waits }: { waits: Wait[] }) {
  if (!waits.length) return <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-leaf/40 bg-leaf/5 px-3 py-1 text-sm text-leaf">✓ Nothing waiting on you</p>;
  return (
    <Reveal delay={0.05} className="mt-6 rounded-2xl border border-line bg-paper-raised p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">Waiting on you · {waits.length}</p>
      <ul className="mt-2 divide-y divide-line">
        {waits.slice(0, 6).map((w, i) => (
          <li key={i}>
            <Link href={w.href} className="group flex items-center gap-3 py-2.5 text-sm">
              <span className={`w-20 shrink-0 rounded-full border px-2 py-0.5 text-center font-mono text-[10px] uppercase tracking-wider ${KIND[w.kind].tone}`}>{KIND[w.kind].mark}</span>
              <span className="min-w-0 flex-1 truncate group-hover:text-accent">{w.text}</span>
              <span aria-hidden className="text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-accent">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

// The stages as a rail, the current one lit.
function Rail({ at }: { at: number }) {
  return (
    <ol className="mt-5 grid grid-cols-6 gap-1.5" aria-label={`Stage: ${STAGES[at].label}`}>
      {STAGES.map((s, j) => (
        <li key={s.id}>
          <span className={`block h-1 rounded-full ${j < at ? "bg-leaf" : j === at ? "animate-pulse bg-accent" : "bg-line"}`} />
          <span className={`mt-1.5 block truncate text-[10px] sm:text-xs ${j === at ? "text-accent" : "text-ink-soft"}`}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

// My house / My space: the newest project in focus, the rest below.
function OwnerBoard({ projects, board, business }: { projects: Card[]; board: Board; business: boolean }) {
  const [focus, ...rest] = projects;
  const at = stage(focus);
  const isBusiness = business || BUSINESS.includes(focus.space_type ?? "");
  return (
    <>
      <Reveal delay={0.08} className="mt-6 overflow-hidden rounded-3xl border border-line bg-paper-raised">
        <div className="grid lg:grid-cols-[1.15fr_1fr]">
          <div className="relative border-b border-line bg-paper p-4 lg:border-b-0 lg:border-r">
            <PlanOr3D projectId={focus.id} layout={board.focus?.layout ?? null}>
              <PlanSketch sketch={board.sketches[focus.id]} labels className="h-full max-h-[22rem] w-full" />
            </PlanOr3D>
          </div>
          <div className="p-6">
            <p className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">
              <span>{SPACE[focus.space_type ?? ""] ?? "Project"}{focus.site?.location ? ` · ${focus.site.location}` : ""}</span>
              {focus.role === "owner" && <DeleteProject id={focus.id} name={projectName(focus)} variant="card" />}
            </p>
            <Link href={`/project/${focus.id}`} className="mt-2 block font-serif text-4xl leading-tight hover:text-accent">
              {projectName(focus)}
            </Link>
            <Rail at={at} />
            <p className="mt-5 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Next</span>
              <span className="mt-0.5 block">{nextLine(focus as Parameters<typeof nextLine>[0], focus.role)}</span>
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              {board.focus?.estimate && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">Estimate, mid-range</p>
                  <p className="mt-1 font-serif text-2xl">{board.focus.estimate}</p>
                </div>
              )}
              {isBusiness ? (
                <OpeningDay projectId={focus.id} date={board.focus?.opening ?? null} set={!!board.focus?.openingSet} canEdit={focus.role === "owner"} />
              ) : (
                board.unread[focus.id] > 0 && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">Thread</p>
                    <p className="mt-1 font-serif text-2xl">{board.unread[focus.id]} new</p>
                  </div>
                )
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href={`/project/${focus.id}`} className="glow-btn rounded-full px-5 py-2.5 text-sm">
                Open project
              </Link>
              <Link href={`/project/${focus.id}?tab=thread`} className="rounded-full border border-line px-5 py-2.5 text-sm transition hover:border-accent hover:text-accent">
                Thread{board.unread[focus.id] ? ` · ${board.unread[focus.id]}` : ""}
              </Link>
              {(focus.status === "building" || focus.status === "done") && (
                <Link href={`/project/${focus.id}?tab=site`} className="rounded-full border border-line px-5 py-2.5 text-sm transition hover:border-accent hover:text-accent">
                  Site
                </Link>
              )}
            </div>
          </div>
        </div>
      </Reveal>
      {rest.length > 0 && (
        <>
          <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">Your other projects</p>
          <Grid projects={rest} board={board} />
        </>
      )}
    </>
  );
}

// Studio: every client by stage. The stage comes from what has happened on the project, so the columns can't be
// dragged.
function StudioBoard({ projects, board }: { projects: Card[]; board: Board }) {
  return (
    <>
      {(board.money.billed || board.money.received) && (
        <Reveal delay={0.06} className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
          <Stat label="Billed, to be paid" value={board.money.billed ?? "—"} />
          <Stat label="Received" value={board.money.received ?? "—"} tone="text-leaf" />
        </Reveal>
      )}
      <Reveal delay={0.1} className="-mx-4 mt-8 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="grid min-w-[60rem] grid-cols-6 items-start gap-3">
          {STAGES.map((s, i) => {
            const here = projects.filter((p) => stage(p) === i);
            return (
              <section key={s.id} aria-label={s.label} className="rounded-2xl border border-line bg-paper-raised/60 p-2">
                <p className="flex items-center justify-between px-1.5 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                  {s.label}
                  <span className={here.length ? "text-accent" : ""}>{here.length}</span>
                </p>
                <ul className="space-y-2">
                  {here.map((p) => (
                    <li key={p.id}>
                      <Link href={`/project/${p.id}`} className="group block rounded-xl border border-line bg-paper p-2.5 transition hover:-translate-y-0.5 hover:border-accent">
                        <PlanSketch sketch={board.sketches[p.id]} className="h-16 w-full" />
                        <p className="mt-2 truncate text-sm font-medium group-hover:text-accent">{projectName(p)}</p>
                        <p className="flex justify-between gap-1 text-xs text-ink-soft">
                          <span className="truncate">{p.owner ? p.owner.split(" ")[0] : "Your project"}</span>
                          {board.unread[p.id] > 0 && <span className="text-accent">● {board.unread[p.id]}</span>}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
                {!here.length && <p className="px-1.5 pb-2 text-xs text-ink-soft/60">—</p>}
              </section>
            );
          })}
        </div>
      </Reveal>
    </>
  );
}

// Sites: today on every site first, then the rest of the builder's projects.
function SitesBoard({ projects, board }: { projects: Card[]; board: Board }) {
  const live = board.sites;
  const others = projects.filter((p) => !live.some((s) => s.id === p.id));
  return (
    <>
      {(board.money.billed || board.money.received) && (
        <Reveal delay={0.06} className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
          <Stat label="Billed, to be paid" value={board.money.billed ?? "—"} />
          <Stat label="Received" value={board.money.received ?? "—"} tone="text-leaf" />
        </Reveal>
      )}
      <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">Today on site</p>
      {live.length ? (
        <ul className="mt-2 space-y-2">
          {live.map((s, i) => {
            const p = projects.find((x) => x.id === s.id)!;
            return (
              <Reveal key={s.id} delay={0.05 * i}>
                <Link href={`/project/${s.id}?tab=site`} className="group grid items-center gap-4 rounded-2xl border border-line bg-paper-raised p-4 transition hover:border-accent sm:grid-cols-[6rem_1fr_auto]">
                  <PlanSketch sketch={board.sketches[s.id]} className="hidden h-14 w-full sm:block" />
                  <div className="min-w-0">
                    <p className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-medium group-hover:text-accent">{projectName(p)}</span>
                      <span className="font-serif text-2xl">{s.overall}%</span>
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-gradient-to-r from-leaf to-accent" style={{ width: `${s.overall}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-ink-soft">
                      {s.now ?? "Handed over"} · {s.onSite} on site today
                      {s.late > 0 && <span className="text-red-600"> · {s.late} behind</span>}
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 rounded-2xl border border-dashed border-line p-5 text-sm text-ink-soft">No site is being built yet. When a design is approved, start its site from the project&apos;s Site tab.</p>
      )}
      {others.length > 0 && (
        <>
          <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">Other projects</p>
          <Grid projects={others} board={board} />
        </>
      )}
    </>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">{label}</p>
      <p className={`mt-1 font-serif text-2xl ${tone}`}>{value}</p>
    </div>
  );
}

// Project cards with their plans drawing themselves.
function Grid({ projects, board }: { projects: Card[]; board: Board }) {
  return (
    <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p, i) => {
        const at = stage(p);
        const tag = p.role !== "owner" ? `You're the ${ROLE_NAME[p.role].toLowerCase()}` : (YOUR[p.space_type ?? ""] ?? "Yours");
        return (
          <li key={p.id} className="relative">
            <Reveal delay={0.04 * Math.min(i, 8)}>
              <Link href={`/project/${p.id}`} className="group block rounded-2xl border border-line bg-paper-raised p-4 transition hover:-translate-y-0.5 hover:border-accent">
                <div className="rounded-xl bg-paper p-2">
                  <PlanSketch sketch={board.sketches[p.id]} className="h-28 w-full" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-[11px] uppercase tracking-widest text-ink-soft">
                  <span>{SPACE[p.space_type ?? ""] ?? "Project"}</span>
                  <span className={`rounded-full border border-line px-2 py-0.5 normal-case tracking-normal ${p.role === "owner" ? "mr-9" : ""}`}>{tag}</span>
                </div>
                <p className="mt-2 font-serif text-2xl leading-tight group-hover:text-accent">{projectName(p)}</p>
                {p.owner && p.role !== "owner" && <p className="text-sm text-ink-soft">{p.owner.split(" ")[0]}&apos;s design</p>}
                <ol className="mt-3 grid grid-cols-6 gap-1" aria-label={`Stage: ${STAGES[at].label}`}>
                  {STAGES.map((s, j) => (
                    <li key={s.id} className={`h-1 rounded-full ${j < at ? "bg-leaf" : j === at ? "bg-accent" : "bg-line"}`} />
                  ))}
                </ol>
                <p className="mt-2 flex items-center justify-between text-sm text-ink-soft">
                  <span className="text-ink">{STAGES[at].label}</span>
                  <span>
                    {board.unread[p.id] > 0 && <span className="mr-2 text-accent">● {board.unread[p.id]}</span>}
                    {when(p.updated_at)}
                  </span>
                </p>
              </Link>
              {p.role === "owner" && (
                <div className="absolute right-6 top-[9.6rem]">
                  <DeleteProject id={p.id} name={projectName(p)} variant="card" />
                </div>
              )}
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}

function Empty({ pro }: { pro: boolean }) {
  return (
    <Reveal delay={0.1} className="mt-10 rounded-3xl border border-dashed border-line p-10 text-center">
      <PlanSketch sketch={null} className="mx-auto h-24 w-40" />
      <p className="mt-4 font-serif text-3xl">{pro ? "No clients yet" : "Nothing here yet"}</p>
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
  );
}

// The header shows at once; the part that needs the signed-in user streams in behind it.
export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <Suspense fallback={<PageLoading label="Loading your projects" />}>
        <HomePageBody />
      </Suspense>
    </div>
  );
}
