"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import { Reveal } from "@/components/fx/Motion";

// The 30-second film: a real run of the app, played from storage (it shows Qloo images, so it isn't in the repo).
// Muted and looping once it's in view; the controls give sound-off viewers captions and anyone a pause. If the film
// isn't there, the section steps aside.
const BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media`;

export function Film() {
  const video = useRef<HTMLVideoElement>(null);
  const [gone, setGone] = useState(false);
  if (gone) return null;
  return (
    <section id="film" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-20 sm:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">See it in 30 seconds</p>
        <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Every side of it: homeowner, café owner, architect, client and builder.</h2>
        <p className="mt-4 text-lg text-ink-soft">A real run of Arcon on a family house in Los Angeles, from three taps to moving in.</p>
      </Reveal>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        onViewportEnter={() => void video.current?.play().catch(() => {})}
        onViewportLeave={() => video.current?.pause()}
        className="mt-10 overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_40px_100px_-50px_var(--accent)]"
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">arcon · the los angeles house</span>
        </div>
        <video ref={video} src={`${BASE}/arcon-30s.mp4`} poster={`${BASE}/arcon-30s.jpg`} muted loop playsInline controls preload="metadata" onError={() => setGone(true)} className="block aspect-video w-full bg-paper" aria-label="A 30-second film of Arcon from every side: homeowner, café owner, architect, client and builder" />
      </motion.div>
    </section>
  );
}
