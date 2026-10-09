import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
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
      <SiteHeader />
      <Suspense fallback={<main className="flex-1" />}>
        <Project params={params} />
      </Suspense>
    </div>
  );
}
