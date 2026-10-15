"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { chime, tick } from "@/components/fx/sfx";

// "Install Arcon": puts Arcon on the home screen as an app. Android and desktop Chrome offer it themselves (we keep
// their prompt for this button); an iPhone can't be asked, so the button shows how (Share, then Add to Home Screen).
// Hidden once it is installed, and when the app is already open from the home screen.

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function InstallApp() {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);
  // A computer gets "Desktop app", a phone or tablet "Install app": the same app, said for where it lands.
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    // The service worker only says "you're offline" when there's no network. Production builds only, so the dev
    // server's hot reload is never served from it.
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent));
    setDesktop(matchMedia("(pointer: fine)").matches && !/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent));
    // The offer is caught by a script in the page head (it can come before this mounts) and announced.
    const w = window as Window & { __arconInstall?: Prompt };
    const onPrompt = () => w.__arconInstall && setPrompt(w.__arconInstall);
    onPrompt();
    const onInstalled = () => {
      setPrompt(null);
      setIos(false);
      chime();
    };
    window.addEventListener("arcon-installable", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("arcon-installable", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt && !ios) return null;
  const install = async () => {
    tick();
    if (!prompt) return setHelp((h) => !h);
    await prompt.prompt();
    // An offer can be used once; Chrome makes a new one on a later visit if they said no.
    (window as Window & { __arconInstall?: Prompt }).__arconInstall = undefined;
    await prompt.userChoice;
    setPrompt(null);
  };
  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => void install()}
        onMouseEnter={() => tick()}
        initial={{ opacity: 0, scale: 0.85, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.94 }}
        title={desktop ? "Install Arcon on this computer: its own window, one click from your dock or taskbar" : "Put Arcon on your home screen"}
        className="group relative flex items-center gap-1.5 overflow-hidden rounded-full border border-accent/50 bg-paper-raised px-3 py-1.5 font-mono text-xs uppercase tracking-[0.15em] text-accent shadow-[0_0_0_0_var(--accent)] transition-shadow hover:shadow-[0_8px_26px_-10px_var(--accent)]"
      >
        {/* a soft pulse around it, and a light sweeping across, like a scan */}
        <span aria-hidden className="pointer-events-none absolute inset-0 animate-ping rounded-full border border-accent/30 [animation-duration:2.4s] motion-reduce:hidden" />
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-8 -skew-x-12 bg-gradient-to-r from-transparent via-accent/25 to-transparent motion-reduce:hidden"
          initial={{ x: "-150%" }}
          animate={{ x: "450%" }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
        />
        <motion.span aria-hidden className="relative" animate={{ y: [0, -1.5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
          {desktop ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4M12 7v5m-2.5-2.5L12 12l2.5-2.5" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M12 7v6m-2.5-2.5L12 13l2.5-2.5M11 18h2" /></svg>
          )}
        </motion.span>
        <span className="relative">{desktop ? "Desktop app" : "Install app"}</span>
      </motion.button>
      <AnimatePresence>
        {help && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-line bg-paper-raised p-4 text-sm shadow-[0_20px_60px_-30px_var(--accent)]"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">On iPhone</p>
            <p className="mt-1">
              Tap <strong>Share</strong> <span aria-hidden>⎙</span> at the bottom of Safari, then <strong>Add to Home Screen</strong>. Arcon opens full screen, like an app.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
