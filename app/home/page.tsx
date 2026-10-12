import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Reveal } from "@/components/fx/Motion";
import { currentUser } from "@/lib/auth/server";
import { getProfile, projectsOf, type ProjectCard } from "@/lib/account/profile";
import type { Role } from "@/lib/account/roles";

export const metadata: Metadata = { title: "Your projects · Arcon" };

const SPACE: Record<string, string> = { house: "House", apartment: "Apartment", office: "Office", cafe: "Café", hotel: "Hotel", shop: "Shop", studio: "Studio" };
const STAGE: Record<string, string> = { interview: "Getting to know you", designing: "Designing", ready: "Design ready" };
const HEADING: Record<Role, string> = { owner: "My projects", business: "My spaces", architect: "Studio", builder: "Sites" };

const nameOf = (p: ProjectCard) => p.title ?? [SPACE[p.space_type ?? ""] ?? "Project", p.site?.location && `in ${p.site.location}`].filter(Boolean).join(" ");

function when(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days < 30 ? `${days} days ago` : new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short" });
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

async function HomePageBody() {
  const userId = await currentUser();
  if (!userId) redirect(`/login?next=${encodeURIComponent("/home")}`);
  const profile = await getProfile(userId);
  if (!profile) redirect("/welcome?next=/home");
  const projects = await projectsOf(userId);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">
      <Reveal>
        <p className="text-sm text-ink-soft">
          {greeting()}, {profile.name.split(" ")[0]}
          {profile.company && <> · {profile.company}</>}
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-serif text-5xl">{HEADING[profile.role]}</h1>
          <div className="flex gap-2">
            <Link href="/start/plan" className="rounded-full border border-line px-5 py-2.5 text-sm transition hover:border-accent hover:text-accent">
              Upload a plan
            </Link>
            <Link href="/start" className="glow-btn rounded-full px-5 py-2.5 text-sm">
              + New design
            </Link>
          </div>
        </div>
      </Reveal>

      {projects.length === 0 ? (
        <Reveal delay={0.1} className="mt-10 rounded-3xl border border-dashed border-line p-10 text-center">
          <p className="font-serif text-3xl">Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">Answer a few questions about you and your space. Arcon turns your taste into a floor plan, a 3D walkthrough and a budget.</p>
          <Link href="/start" className="glow-btn mt-6 inline-block rounded-full px-6 py-3">
            Start your first design
          </Link>
        </Reveal>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <li key={p.id}>
              <Reveal delay={0.04 * Math.min(i, 8)}>
                <Link href={`/project/${p.id}`} className="group block rounded-2xl border border-line bg-paper-raised p-5 transition hover:-translate-y-0.5 hover:border-accent">
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest text-ink-soft">
                    <span>{SPACE[p.space_type ?? ""] ?? "Project"}</span>
                    <span className={p.status === "ready" ? "text-leaf" : "text-accent"}>{STAGE[p.status] ?? p.status}</span>
                  </div>
                  <p className="mt-3 font-serif text-2xl leading-tight group-hover:text-accent">{nameOf(p)}</p>
                  <p className="mt-4 text-sm text-ink-soft">Updated {when(p.updated_at)}</p>
                </Link>
              </Reveal>
            </li>
          ))}
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
      <Suspense fallback={<main className="flex-1" />}>
        <HomePageBody  />
      </Suspense>
    </div>
  );
}
