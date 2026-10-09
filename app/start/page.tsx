import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Interview } from "@/components/interview/Interview";

export const metadata: Metadata = { title: "Start your design · Arcon" };

export default function StartPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" aria-label="Arcon home">
          <Logo size={26} />
        </Link>
      </header>
      <Interview />
    </div>
  );
}
