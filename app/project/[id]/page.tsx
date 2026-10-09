import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { ProjectView } from "@/components/project/ProjectView";

export const metadata: Metadata = { title: "Your design · Arcon" };

async function Project({ params }: { params: PageProps<"/project/[id]">["params"] }) {
  const { id } = await params;
  return <ProjectView id={id} />;
}

// The header renders at once; the project streams in behind it.
export default function ProjectPage({ params }: PageProps<"/project/[id]">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" aria-label="Arcon home">
          <Logo size={26} />
        </Link>
      </header>
      <Suspense fallback={<main className="flex-1" />}>
        <Project params={params} />
      </Suspense>
    </div>
  );
}
