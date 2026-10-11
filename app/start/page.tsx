import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";
import { Interview } from "@/components/interview/Interview";

export const metadata: Metadata = { title: "Start your design · Arcon" };

export default function StartPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <p className="mx-auto w-full max-w-3xl px-4 text-right text-sm text-ink-soft">
        Already have a floor plan?{" "}
        <Link href="/start/plan" className="font-medium text-accent underline-offset-2 hover:underline">
          Upload it and skip the questions
        </Link>
      </p>
      <Interview />
    </div>
  );
}
