import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Privacy · Arcon" };

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-4 py-5 sm:px-8">
        <Link href="/" aria-label="Arcon home">
          <Logo size={26} />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 py-10 leading-relaxed">
        <h1 className="font-serif text-5xl">Privacy</h1>
        <p className="mt-6 text-ink-soft">Last updated 9 October 2026.</p>

        <h2 className="mt-10 font-serif text-3xl">Cookies</h2>
        <p className="mt-3">
          Arcon sets one cookie, <code>arcon_guest</code>. It holds a random id, signed so it can&apos;t be forged, that keeps your
          project yours without an account. Arcon sets no analytics, tracking or advertising cookies.
        </p>

        <h2 className="mt-10 font-serif text-3xl">What we store</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Your project: its type, size, location, the answers you give in the interview, and the designs Arcon makes.</li>
          <li>The places, brands, films and music you name, used to work out your style.</li>
        </ul>
        <p className="mt-3">We store this in a database hosted in the United States. We don&apos;t sell it or share it for advertising.</p>

        <h2 className="mt-10 font-serif text-3xl">Who processes it</h2>
        <p className="mt-3">
          To run Arcon, your messages go to the AI model that powers the interview, and the things you love are looked up in a
          taste database. Voice input and speech use your browser&apos;s built-in speech features.
        </p>

        <h2 className="mt-10 font-serif text-3xl">Deleting your data</h2>
        <p className="mt-3">Ask us to delete a project and everything in it, and we will. Clearing your browser&apos;s cookies also ends access to it from that browser.</p>
      </main>
    </div>
  );
}
