import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-5 sm:px-8">
        <Logo size={30} />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="max-w-2xl font-serif text-5xl leading-tight sm:text-6xl">Spaces designed around who you are.</h1>
        <p className="mt-6 max-w-xl text-lg text-ink-soft">
          Tell Arcon the films, places and things you love. It designs your home, hotel, office or café from them, then
          walks you through it in 3D.
        </p>
        <Link href="/start" className="mt-10 rounded-full bg-ink px-7 py-3.5 text-lg text-paper transition hover:opacity-90">
          Start designing
        </Link>
      </main>
    </div>
  );
}
